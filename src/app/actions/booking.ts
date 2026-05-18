"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { headers } from "next/headers";

// Fetch all available girls with optional filters
export async function getGirls(filters?: {
  location?: string;
  category?: string;
  sortBy?: "popular" | "price_asc" | "price_desc" | "rating";
}) {
  try {
    const whereClause: any = { available: true };

    if (filters?.location && filters.location !== "All") {
      whereClause.location = filters.location;
    }

    if (filters?.category && filters.category !== "All") {
      whereClause.category = filters.category;
    }

    let orderBy: any = { createdAt: "desc" };

    if (filters?.sortBy === "popular") {
      orderBy = { reviewsCount: "desc" };
    } else if (filters?.sortBy === "price_asc") {
      orderBy = { ratePerHour: "asc" };
    } else if (filters?.sortBy === "price_desc") {
      orderBy = { ratePerHour: "desc" };
    } else if (filters?.sortBy === "rating") {
      orderBy = { rating: "desc" };
    }

    const girls = await prisma.girl.findMany({
      where: whereClause,
      orderBy: orderBy,
    });

    return { success: true, data: girls };
  } catch (error) {
    console.error("Failed to fetch girls:", error);
    return { success: false, error: "Failed to load profiles." };
  }
}

// Fetch details for a specific model profile
export async function getGirlById(id: string) {
  try {
    const girl = await prisma.girl.findUnique({
      where: { id },
    });

    if (!girl) {
      return { success: false, error: "Model profile not found." };
    }

    return { success: true, data: girl };
  } catch (error) {
    console.error("Failed to fetch model profile details:", error);
    return { success: false, error: "Failed to retrieve profile details." };
  }
}

// Create a new booking reservation and initiate Cashfree session
export async function createBooking(formData: {
  girlId: string;
  bookingDate?: string; // Optional ISO string
  bookingType?: "hourly" | "daily";
  durationHours: number;
  durationDays?: number;
  location?: string;
  contactPhone?: string;
  notes?: string;
}) {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "You must be logged in to book a VIP date." };
  }

  try {
    const { 
      girlId, 
      bookingDate, 
      bookingType = "hourly", 
      durationHours, 
      durationDays = 0, 
      location, 
      contactPhone, 
      notes 
    } = formData;

    if (!girlId) {
      return { success: false, error: "Please select a model to book." };
    }

    const finalBookingDate = bookingDate ? new Date(bookingDate) : new Date();
    const finalLocation = location?.trim() ? location.trim() : "Not Specified (Agency will contact you)";
    const finalContactPhone = contactPhone?.trim() ? contactPhone.trim() : "Not Provided";

    // Fetch the model's hourly/daily rate to calculate the total price securely on the server
    const girl = await prisma.girl.findUnique({
      where: { id: girlId },
    });

    if (!girl) {
      return { success: false, error: "Selected model profile does not exist." };
    }

    if (!girl.available) {
      return { success: false, error: "This model is currently unavailable for bookings." };
    }

    let totalPrice = 0;
    if (bookingType === "daily") {
      totalPrice = girl.ratePerDay * Number(durationDays || 1);
    } else {
      totalPrice = girl.ratePerHour * Number(durationHours || 1);
    }

    // 1. Create a pending booking in the PostgreSQL database
    const booking = await prisma.booking.create({
      data: {
        userId: session.userId,
        girlId: girl.id,
        bookingDate: finalBookingDate,
        bookingType,
        durationHours: bookingType === "hourly" ? Number(durationHours) : 0,
        durationDays: bookingType === "daily" ? Number(durationDays) : 0,
        totalPrice,
        location: finalLocation,
        contactPhone: finalContactPhone,
        notes: notes?.trim() || null,
        status: "pending", // VIP reservation starts as pending payment
      },
      include: {
        girl: true,
      },
    });

    // 2. Setup Cashfree parameters
    const cfMode = process.env.CASHFREE_MODE || "production";
    const cfAppId = process.env.CASHFREE_APP_ID;
    const cfSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cfApiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";

    // Dynamically retrieve base host from request headers for callback redirection
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = (host.includes("localhost") && cfMode !== "production") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Graceful simulation fallback if credentials are not present, or sandbox is disabled
    if (!cfAppId || !cfSecretKey) {
      console.warn("Cashfree credentials missing. Running VIP Booking in local simulation mode.");
      return {
        success: true,
        isSimulation: true,
        bookingId: booking.id,
        orderId: `mock_booking_${booking.id}`,
        totalPrice,
        cfMode,
        baseUrl
      };
    }

    const endpoint = cfMode === "production"
      ? "https://api.cashfree.com/pg/orders"
      : "https://sandbox.cashfree.com/pg/orders";

    const orderId = `booking_${booking.id}`;
    
    // Standard Cashfree Order payload
    const payload = {
      order_amount: totalPrice,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: session.userId,
        customer_email: session.email,
        customer_phone: finalContactPhone.length >= 10 ? finalContactPhone.replace(/\D/g, '') : "9999999999",
        customer_name: session.name
      },
      order_meta: {
        return_url: `${baseUrl}/api/booking/callback?order_id={order_id}`
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-client-id": cfAppId,
        "x-client-secret": cfSecretKey,
        "x-api-version": cfApiVersion,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cashfree Booking PG Creation Failed:", data);
      // Fallback to simulation mode to prevent blocking VIP bookings in testing environments
      const isAuthError = data.message === "authentication Failed" || data.code === "request_failed" || data.type === "authentication_error";
      if (isAuthError) {
        console.warn("Cashfree API auth failed. Falling back to reservation simulation checkout.");
        return {
          success: true,
          isSimulation: true,
          bookingId: booking.id,
          orderId: `mock_booking_${booking.id}`,
          totalPrice,
          cfMode,
          baseUrl,
          warning: "Cashfree Auth Failed. Using sandbox VIP payment simulation."
        };
      }
      return { success: false, error: data.message || "Failed to initiate Cashfree payment gateway session." };
    }

    return {
      success: true,
      isSimulation: false,
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
      bookingId: booking.id,
      totalPrice,
      cfMode,
      baseUrl
    };
  } catch (error: any) {
    console.error("Failed to create booking:", error);
    return { success: false, error: error.message || "Booking failed. Internal server error." };
  }
}

// Retrieve booking history for the logged-in user
export async function getUserBookings() {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "Unauthorized access.", data: [] };
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: session.userId },
      include: {
        girl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error("Failed to fetch user bookings:", error);
    return { success: false, error: "Failed to load bookings list.", data: [] };
  }
}

// Cancel an existing reservation
export async function cancelBooking(bookingId: string) {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking record not found." };
    }

    // Admin can cancel any booking; normal users can only cancel their own
    if (booking.userId !== session.userId && session.email !== "admin@hotwebhd.com") {
      return { success: false, error: "Unauthorized. You do not own this booking." };
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
      },
    });

    return { success: true, message: "Booking cancelled successfully.", data: updated };
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return { success: false, error: "Failed to cancel the reservation." };
  }
}

// Fetch all system bookings for the Admin Dashboard (Admin Only)
export async function getAllBookings() {
  const session = await getCurrentUser();
  if (!session || session.email !== "admin@hotwebhd.com") {
    return { success: false, error: "Unauthorized administrative access.", data: [] };
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        girl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error("Failed to retrieve system bookings:", error);
    return { success: false, error: "Failed to query all system bookings.", data: [] };
  }
}

// Update the booking status directly from the Admin Dashboard (Admin Only)
export async function updateBookingStatus(bookingId: string, status: string) {
  const session = await getCurrentUser();
  if (!session || session.email !== "admin@hotwebhd.com") {
    return { success: false, error: "Unauthorized administrative access." };
  }

  try {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        girl: true,
        user: true
      }
    });

    return { success: true, message: `Booking status updated to ${status} successfully!`, data: updated };
  } catch (error: any) {
    console.error("Failed to update booking status:", error);
    return { success: false, error: error.message || "Failed to update booking status." };
  }
}

// Delete booking record permanently from the Admin Dashboard (Admin Only)
export async function deleteBooking(bookingId: string) {
  const session = await getCurrentUser();
  if (!session || session.email !== "admin@hotwebhd.com") {
    return { success: false, error: "Unauthorized administrative access." };
  }

  try {
    await prisma.booking.delete({
      where: { id: bookingId }
    });

    return { success: true, message: "Booking record deleted permanently." };
  } catch (error: any) {
    console.error("Failed to delete booking:", error);
    return { success: false, error: error.message || "Failed to delete booking record." };
  }
}

// Fetch booking by ID with girl relation for success page
export async function getBookingById(bookingId: string) {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        girl: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking record not found." };
    }

    if (booking.userId !== session.userId && session.email !== "admin@hotwebhd.com") {
      return { success: false, error: "Unauthorized access to this booking record." };
    }

    return { success: true, data: booking };
  } catch (error) {
    console.error("Failed to fetch booking details:", error);
    return { success: false, error: "Failed to load booking details." };
  }
}

