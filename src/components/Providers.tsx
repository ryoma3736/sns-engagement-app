'use client';

/**
 * Client-side Providers Component
 *
 * Wraps the application with necessary providers (SessionProvider, etc.)
 * This is a Client Component to enable NextAuth session management.
 *
 * @module components/Providers
 */

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Initial session from server (optional, for SSR) */
  session?: Session | null;
}

/**
 * Application providers wrapper
 *
 * Provides session context and other global providers to the application.
 * Must be used in a Client Component.
 *
 * @param props - Component props
 * @returns Provider-wrapped children
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers>
 *           {children}
 *         </Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children, session }: ProvidersProps): JSX.Element {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

export default Providers;
