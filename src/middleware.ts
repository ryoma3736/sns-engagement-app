/**
 * Authentication Middleware
 *
 * Protects routes that require authentication and handles
 * redirects for authenticated/unauthenticated users.
 *
 * @module middleware
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Configuration for protected routes
 */
const config = {
  /**
   * Routes that require authentication
   * Users without a valid session will be redirected to sign in
   */
  protectedRoutes: [
    '/dashboard',
    '/settings',
    '/profile',
    '/api/protected',
  ],

  /**
   * Auth routes (sign in, sign up pages)
   * Authenticated users will be redirected away from these
   */
  authRoutes: [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
  ],

  /**
   * Public API routes that don't require authentication
   */
  publicApiRoutes: [
    '/api/auth',
    '/api/analyze',
    '/api/optimize',
  ],

  /**
   * Default redirect URLs
   */
  redirects: {
    afterLogin: '/',
    toLogin: '/auth/signin',
  },
};

/**
 * Check if a path matches any pattern in the list
 *
 * @param path - The path to check
 * @param patterns - List of patterns to match against
 * @returns True if path matches any pattern
 */
function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Exact match
    if (path === pattern) return true;
    // Prefix match (e.g., /dashboard matches /dashboard/settings)
    if (path.startsWith(`${pattern}/`)) return true;
    return false;
  });
}

/**
 * Authentication middleware
 *
 * Handles route protection and authentication redirects.
 *
 * @param request - The incoming request
 * @returns Response or redirect
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Get the authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Check route types
  const isProtectedRoute = matchesPath(pathname, config.protectedRoutes);
  const isAuthRoute = matchesPath(pathname, config.authRoutes);
  const isPublicApiRoute = matchesPath(pathname, config.publicApiRoutes);

  // Allow public API routes without authentication
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Protected routes: redirect to login if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL(config.redirects.toLogin, request.url);
    // Add callback URL to redirect back after login
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Auth routes: redirect to home if already authenticated
  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = new URL(config.redirects.afterLogin, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add user info to headers for downstream use (optional)
  const response = NextResponse.next();

  if (isAuthenticated && token) {
    // Pass user info through headers (can be read in Server Components)
    response.headers.set('x-user-id', (token.id as string) ?? '');
    response.headers.set('x-user-email', (token.email as string) ?? '');
  }

  return response;
}

/**
 * Middleware configuration
 *
 * Specifies which routes the middleware should run on.
 * Uses Next.js matcher syntax.
 */
export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Export config for Next.js
export { middlewareConfig as config };
