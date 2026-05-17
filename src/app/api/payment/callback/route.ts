import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hotweb-hd-token-key-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  const host = request.headers.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&error=missing_order_id`);
  }

  try {
    const cfAppId = process.env.CASHFREE_APP_ID;
    const cfSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cfApiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
    const cfMode = process.env.CASHFREE_MODE || "production";

    const endpoint = cfMode === "production"
      ? `https://api.cashfree.com/pg/orders/${orderId}`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    // Verify payment status with Cashfree PG
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
      console.error("Cashfree Order Verify Request Failed:", errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&error=verification_failed`);
    }

    const data = await res.json();

    // Verify order_status is PAID (Cashfree standard order status)
    if (data.order_status !== "PAID") {
      console.warn("Cashfree Order Status is not PAID:", data.order_status);
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&error=not_paid`);
    }

    // Extract secure user ID from generated order ID structure: order_${userId}_${timestamp}
    const orderParts = orderId.split("_");
    const userId = orderParts[1];

    if (!userId) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&error=invalid_order_format`);
    }

    // 1. Upgrade user in the SQLite Database to premium VIP status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { subscription: "premium" },
    });

    // 2. Re-sign session cookie with 'premium' subscription to instantly sync client views
    const tokenPayload = {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      subscription: updatedUser.subscription,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    // 3. Write fresh cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Success Redirection
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=success`);

  } catch (err: any) {
    console.error("Cashfree Callback Verification Exception:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&error=exception`);
  }
}
