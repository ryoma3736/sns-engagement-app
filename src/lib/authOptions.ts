/**
 * NextAuth.js Configuration Options
 *
 * Centralized authentication configuration used by both
 * the NextAuth route handler and server-side utilities.
 *
 * @module lib/authOptions
 */

import type { NextAuthOptions, Session, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * GitHub OAuth Provider
     * Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables
     */
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),

    /**
     * Google OAuth Provider
     * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  /**
   * Session configuration
   * Using JWT strategy for stateless sessions
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * JWT configuration
   */
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * Custom pages for authentication flows
   */
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  /**
   * Callbacks for customizing authentication behavior
   */
  callbacks: {
    /**
     * JWT callback - called whenever a JWT is created or updated
     * @param token - The JWT token
     * @param user - The user object (only available on sign in)
     * @returns Modified JWT token
     */
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * Session callback - called whenever a session is checked
     * @param session - The session object
     * @param token - The JWT token
     * @returns Modified session object
     */
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user && token.id) {
        // Extend session.user with id from token
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },

    /**
     * Sign in callback - controls whether a user is allowed to sign in
     * @returns True to allow sign in, false to deny
     */
    async signIn(): Promise<boolean> {
      // Add custom sign-in validation logic here if needed
      return true;
    },

    /**
     * Redirect callback - controls where users are redirected after authentication
     * @param url - The URL to redirect to
     * @param baseUrl - The base URL of the application
     * @returns The URL to redirect to
     */
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }): Promise<string> {
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  /**
   * Enable debug mode in development
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Secret for encrypting tokens and cookies
   * MUST be set in production via NEXTAUTH_SECRET environment variable
   */
  secret: process.env.NEXTAUTH_SECRET,
};
