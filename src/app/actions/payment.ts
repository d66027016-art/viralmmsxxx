"use server";

import { getCurrentUser } from "./auth";
import { headers } from "next/headers";

/**
 * Creates a Cashfree payment order for Premium VIP subscription
 * Cost: 199.00 INR
 */
export async function createCashfreeOrder() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required to upgrade subscription plan." };
    }

    const cfMode = process.env.CASHFREE_MODE || "production";

    // Resolve base host dynamically from client headers to ensure correct callback routes
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = (host.includes("localhost") && cfMode !== "production") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const orderId = `order_${user.userId}_${Date.now()}`;
    const amount = 499.00;

    const cfAppId = process.env.CASHFREE_APP_ID;
    const cfSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cfApiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";

    if (!cfAppId || !cfSecretKey) {
      return {
        success: false,
        error: "Cashfree API keys are missing in the .env configuration."
      };
    }

    const endpoint = cfMode === "production"
      ? "https://api.cashfree.com/pg/orders"
      : "https://sandbox.cashfree.com/pg/orders";

    // Cashfree PG Body parameters (compliant with API version 2023-08-01)
    const payload = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: user.userId,
        customer_email: user.email,
        customer_phone: "9999999999", // Complies with Cashfree mandatory phone requirement
        customer_name: user.name
      },
      order_meta: {
        return_url: `${baseUrl}/api/payment/callback?order_id={order_id}`
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
      console.error("Cashfree Order Create Error Response:", data);
      const isAuthError = data.message === "authentication Failed" || data.code === "request_failed" || data.type === "authentication_error";
      return {
        success: false,
        isAuthError,
        error: data.message || "Failed to create checkout session with Cashfree."
      };
    }

    return {
      success: true,
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
      cfMode
    };

  } catch (err: any) {
    console.error("createCashfreeOrder Exception:", err);
    return { success: false, error: err.message || "Network exception occurred." };
  }
}
