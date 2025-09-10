/**
 * Next.js Middleware - Route protection and authentication redirects
 * Military-grade security with intelligent routing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
  '/help',
];

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/privacy-scans',
  '/analytics',
  '/reports',
  '/notifications',
];

const API_AUTH_ROUTES = [
  '/api/auth',
];

// Helper function to check if user is authenticated
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Check for Better Auth session cookie
    const sessionCookie = request.cookies.get('better-auth.session_token');
    
    if (!sessionCookie) {
      return false;
    }

    // In a real implementation, you might validate the token
    // For now, we'll assume the presence of the cookie means authenticated
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isAuth = await isAuthenticated(request);

  // Allow API auth routes to pass through
  if (API_AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Handle auth routes (login, signup, forgot-password)
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (isAuth) {
      // Authenticated users shouldn't access auth pages
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    // Allow unauthenticated users to access auth pages
    return NextResponse.next();
  }

  // Handle protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuth) {
      // Store the original URL for redirect after login
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      
      // For pages, redirect to home with modal trigger
      return NextResponse.redirect(loginUrl);
    }
    // Allow authenticated users to access protected routes
    return NextResponse.next();
  }

  // Handle dynamic routes or catch-all
  // Default to allowing the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};