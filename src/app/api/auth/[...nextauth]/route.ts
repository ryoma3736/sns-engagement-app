/**
 * NextAuth.js API Route Handler
 *
 * This file handles authentication API routes using NextAuth.js.
 * Configuration is imported from lib/authOptions.ts.
 *
 * @see https://next-auth.js.org/
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * NextAuth handler for API routes
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
