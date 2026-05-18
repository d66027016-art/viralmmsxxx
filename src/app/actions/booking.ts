"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

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

// Create a new booking reservation
export async function createBooking(formData: {
  girlId: string;
  bookingDate: string; // ISO string
  bookingType?: "hourly" | "daily";
  durationHours: number;
  durationDays?: number;
  location: string;
  contactPhone: string;
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

    if (!girlId || !bookingDate || !location || !contactPhone) {
      return { success: false, error: "Please fill out all required booking details." };
    }

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

    const booking = await prisma.booking.create({
      data: {
        userId: session.userId,
        girlId: girl.id,
        bookingDate: new Date(bookingDate),
        bookingType,
        durationHours: bookingType === "hourly" ? Number(durationHours) : 0,
        durationDays: bookingType === "daily" ? Number(durationDays) : 0,
        totalPrice,
        location: location.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes?.trim() || null,
        status: "confirmed", // Automatically confirm for high-end feel in this demo!
      },
      include: {
        girl: true,
      },
    });

    return { success: true, message: "VIP Booking Confirmed Successfully!", data: booking };
  } catch (error) {
    console.error("Failed to create booking:", error);
    return { success: false, error: "Booking failed. Internal server error." };
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

    if (booking.userId !== session.userId) {
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
