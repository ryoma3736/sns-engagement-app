/**
 * Authentication Utilities
 *
 * Provides helper functions for authentication checks and session management.
 * Uses NextAuth.js for underlying authentication.
 *
 * @module lib/auth
 */

import { getServerSession as nextAuthGetServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * Extended user type with optional ID
 */
export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Extended session type with typed user
 */
export interface AuthSession extends Session {
  user?: AuthUser;
}

/**
 * Result type for authentication checks
 */
export interface AuthCheckResult {
  authenticated: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
}

/**
 * Get the server-side session
 *
 * Wrapper around NextAuth's getServerSession with proper typing.
 * Use this in Server Components and API routes.
 *
 * @returns Promise resolving to the session or null if not authenticated
 *
 * @example
 * ```typescript
 * // In a Server Component
 * const session = await getServerSession();
 * if (session) {
 *   console.log('User:', session.user?.name);
 * }
 * ```
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const session = await nextAuthGetServerSession(authOptions);
  return session as AuthSession | null;
}

/**
 * Check if the current user is authenticated
 *
 * Returns a detailed result object with authentication status,
 * session data, and user information.
 *
 * @returns Promise resolving to authentication check result
 *
 * @example
 * ```typescript
 * const { authenticated, user } = await checkAuth();
 * if (!authenticated) {
 *   redirect('/auth/signin');
 * }
 * ```
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  const session = await getServerSession();

  return {
    authenticated: session !== null,
    session,
    user: session?.user ?? null,
  };
}

/**
 * Require authentication for a page or API route
 *
 * Throws an error if the user is not authenticated.
 * Use this as a guard in protected routes.
 *
 * @returns Promise resolving to the authenticated session
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * // In a Server Component or API route
 * try {
 *   const session = await requireAuth();
 *   // User is authenticated, proceed with protected logic
 * } catch (error) {
 *   redirect('/auth/signin');
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Get the current user from the session
 *
 * Convenience function to extract just the user object from the session.
 *
 * @returns Promise resolving to the user or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Welcome,', user.name);
 * }
 * ```
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * Check if user has a specific email domain
 *
 * Useful for restricting access to users from specific organizations.
 *
 * @param domain - The email domain to check (e.g., 'company.com')
 * @returns Promise resolving to true if user has the specified domain
 *
 * @example
 * ```typescript
 * const isInternalUser = await hasEmailDomain('mycompany.com');
 * if (!isInternalUser) {
 *   throw new Error('Access restricted to internal users');
 * }
 * ```
 */
export async function hasEmailDomain(domain: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return false;
  }

  return user.email.endsWith(`@${domain}`);
}

/**
 * Protected route configuration type
 */
export interface ProtectedRouteConfig {
  /** Routes that require authentication */
  protectedRoutes: string[];
  /** Routes that should redirect authenticated users (e.g., login page) */
  authRoutes: string[];
  /** Default redirect for unauthenticated users */
  defaultLoginUrl: string;
  /** Default redirect for authenticated users on auth pages */
  defaultRedirectUrl: string;
}

/**
 * Default configuration for protected routes
 */
export const defaultProtectedRouteConfig: ProtectedRouteConfig = {
  protectedRoutes: ['/dashboard', '/settings', '/profile', '/api/protected'],
  authRoutes: ['/auth/signin', '/auth/signup'],
  defaultLoginUrl: '/auth/signin',
  defaultRedirectUrl: '/',
};

/**
 * Check if a path should be protected
 *
 * @param path - The path to check
 * @param config - Route configuration (optional, uses defaults)
 * @returns True if the path requires authentication
 *
 * @example
 * ```typescript
 * if (isProtectedRoute('/dashboard')) {
 *   const session = await requireAuth();
 * }
 * ```
 */
export function isProtectedRoute(
  path: string,
  config: ProtectedRouteConfig = defaultProtectedRouteConfig
): boolean {
  return config.protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is an auth route (login, signup, etc.)
 *
 * @param path - The path to check
 * @param config - Route configuration (optional, uses defaults)
 * @returns True if the path is an authentication route
 */
export function isAuthRoute(
  path: string,
  config: ProtectedRouteConfig = defaultProtectedRouteConfig
): boolean {
  return config.authRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
