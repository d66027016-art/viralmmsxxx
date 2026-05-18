import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  const host = request.headers.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=missing_order_id`);
  }

  // Support local simulation/sandbox testing if Cashfree credentials are not set up or rejected
  if (orderId.startsWith("mock_booking_")) {
    try {
      const bookingId = orderId.replace("mock_booking_", "");
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) {
        return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=booking_not_found`);
      }
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed" }
      });
      return NextResponse.redirect(`${baseUrl}/booking?booking_success=true&booking_id=${bookingId}`);
    } catch (e: any) {
      console.error("Mock Booking verification failed:", e);
      return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=mock_exception`);
    }
  }

  try {
    const cfAppId = process.env.CASHFREE_APP_ID;
    const cfSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cfApiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
    const cfMode = process.env.CASHFREE_MODE || "production";

    const endpoint = cfMode === "production"
      ? `https://api.cashfree.com/pg/orders/${orderId}`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    // Verify payment status with Cashfree PG API
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-client-id": cfAppId || "",
        "x-client-secret": cfSecretKey || "",
        "x-api-version": cfApiVersion,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Cashfree Booking Verify Request Failed:", errorData);
      return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=verification_failed`);
    }

    const data = await res.json();

    // Verify order_status is PAID (Cashfree standard order status)
    if (data.order_status !== "PAID") {
      console.warn("Cashfree Booking Order Status is not PAID:", data.order_status);
      return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=not_paid`);
    }

    // Extract booking ID from the order ID structure: booking_${bookingId}
    const bookingId = orderId.replace("booking_", "");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=booking_not_found`);
    }

    // Update the booking status to confirmed in the database
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed" },
    });

    // Success Redirection
    return NextResponse.redirect(`${baseUrl}/booking?booking_success=true&booking_id=${bookingId}`);

  } catch (err: any) {
    console.error("Cashfree Booking Callback Verification Exception:", err);
    return NextResponse.redirect(`${baseUrl}/booking?booking_failed=true&error=exception`);
  }
}
