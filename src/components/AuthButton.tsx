'use client';

/**
 * Authentication Button Component
 *
 * Displays a login/logout button based on the current authentication state.
 * Shows user avatar and name when authenticated.
 *
 * @module components/AuthButton
 */

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

/**
 * Props for the AuthButton component
 */
interface AuthButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Show user name alongside avatar when authenticated */
  showName?: boolean;
  /** Compact mode - shows only avatar/icon */
  compact?: boolean;
}

/**
 * Authentication button with login/logout functionality
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AuthButton />
 *
 * // With custom styling
 * <AuthButton className="my-custom-class" showName />
 *
 * // Compact mode
 * <AuthButton compact />
 * ```
 */
export function AuthButton({
  className = '',
  showName = false,
  compact = false,
}: AuthButtonProps): JSX.Element {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Loading state
  if (status === 'loading') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-white/20 rounded-full" />
      </div>
    );
  }

  // Not authenticated - show sign in button
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className={`
          px-4 py-2
          bg-gradient-to-r from-purple-500 to-pink-500
          hover:from-purple-600 hover:to-pink-600
          text-white font-medium rounded-lg
          transition-all duration-200
          shadow-lg hover:shadow-xl
          ${compact ? 'px-3 py-1.5 text-sm' : ''}
          ${className}
        `}
      >
        {compact ? 'Login' : 'Sign In'}
      </button>
    );
  }

  // Authenticated - show user info and logout option
  const userImage = session.user?.image;
  const userName = session.user?.name ?? 'User';
  const userEmail = session.user?.email ?? '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="User menu"
        aria-expanded={isMenuOpen}
      >
        {/* Avatar */}
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="w-8 h-8 rounded-full ring-2 ring-purple-500/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
            {userInitial}
          </div>
        )}

        {/* Name (optional) */}
        {showName && !compact && (
          <span className="text-white/90 text-sm font-medium hidden sm:block">
            {userName}
          </span>
        )}

        {/* Dropdown indicator */}
        {!compact && (
          <svg
            className={`w-4 h-4 text-white/70 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-xl border border-white/10 overflow-hidden z-20">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {userInitial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{userName}</p>
                  <p className="text-white/50 text-sm truncate">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <a
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </a>
              <a
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 text-white/80 hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </a>
            </div>

            {/* Sign Out */}
            <div className="border-t border-white/10 py-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Simple sign in button without dropdown
 *
 * @example
 * ```tsx
 * <SignInButton provider="github">Sign in with GitHub</SignInButton>
 * ```
 */
interface SignInButtonProps {
  /** OAuth provider to sign in with */
  provider?: 'github' | 'google';
  /** Button content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SignInButton({
  provider,
  children,
  className = '',
}: SignInButtonProps): JSX.Element {
  const handleSignIn = () => {
    if (provider) {
      signIn(provider);
    } else {
      signIn();
    }
  };

  const providerIcons: Record<string, JSX.Element> = {
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  };

  return (
    <button
      onClick={handleSignIn}
      className={`
        flex items-center justify-center gap-2
        px-4 py-2.5
        bg-white/10 hover:bg-white/20
        text-white font-medium rounded-lg
        border border-white/20
        transition-all duration-200
        ${className}
      `}
    >
      {provider && providerIcons[provider]}
      {children ?? `Sign in${provider ? ` with ${provider.charAt(0).toUpperCase() + provider.slice(1)}` : ''}`}
    </button>
  );
}

/**
 * Sign out button component
 *
 * @example
 * ```tsx
 * <SignOutButton>Log out</SignOutButton>
 * ```
 */
interface SignOutButtonProps {
  /** Button content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SignOutButton({
  children = 'Sign Out',
  className = '',
}: SignOutButtonProps): JSX.Element {
  return (
    <button
      onClick={() => signOut()}
      className={`
        px-4 py-2
        text-red-400 hover:text-red-300
        hover:bg-red-500/10
        font-medium rounded-lg
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default AuthButton;
