import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const host = request.headers.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Clear invalid token cookie securely
  const cookieStore = await cookies();
  cookieStore.delete("token");

  // Redirect back to login gate cleanly without any old cookie tokens
  return NextResponse.redirect(`${baseUrl}/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
