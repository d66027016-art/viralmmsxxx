import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/watch') || 
    pathname.startsWith('/admin');

  if (isProtectedRoute && !token) {
    // Redirect unauthenticated user to registration/login
    const loginUrl = new URL('/auth', request.url);
    // Add original redirect path as query param
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to bypass /auth
  if (pathname === '/auth' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Matching paths
export const config = {
  matcher: ['/dashboard/:path*', '/watch/:path*', '/admin/:path*', '/auth'],
};
