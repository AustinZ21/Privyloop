/**
 * Protected Route Component - Military-grade route protection
 * Handles authentication requirements and redirects
 */

"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { useAuthState } from 'src/lib/auth-client';
import { useDialogManager } from 'src/lib/dialog-manager';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  redirectTo?: string;
  fallbackToModal?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireVerification = false,
  redirectTo = '/',
  fallbackToModal = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuthState();
  const { open } = useDialogManager();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Handle authentication requirement
    if (requireAuth && !isAuthenticated) {
      // Store current URL for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      
      if (fallbackToModal) {
        // Open login modal with redirect context
        localStorage.setItem('auth-redirect-url', currentPath);
        open('login');
        return;
      } else {
        // Redirect to login page
        const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
        if (window.location.pathname + window.location.search !== loginUrl) {
          router.replace(loginUrl);
        }
        return;
      }
    }

    // Handle email verification requirement
    if (requireAuth && isAuthenticated && requireVerification && user && !user.emailVerified) {
      open('email-verification', {
        data: { email: user.email }
      });
      return;
    }

    // Handle authenticated users accessing auth pages
    if (!requireAuth && isAuthenticated) {
      // Read redirect once to avoid effect loops due to searchParams identity changes
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const redirect = params.get('redirect') || redirectTo;
      if (redirect && (window.location.pathname !== redirect)) {
        router.replace(redirect);
      } else if (!redirect && window.location.pathname !== redirectTo) {
        router.replace(redirectTo);
      }
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requireVerification,
    fallbackToModal,
    redirectTo,
    router,
    open
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-[#34D3A6] animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
            <p className="text-gray-400">Verifying your authentication status</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication required but user not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallbackToModal) {
      // Show placeholder while modal loads
      return (
        <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-[#34D3A6]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
              <p className="text-gray-400">Please sign in to continue</p>
            </div>
          </div>
        </div>
      );
    }
    return null; // Will redirect via useEffect
  }

  // Email verification required but user not verified
  if (requireAuth && isAuthenticated && requireVerification && user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Email Verification Required</h2>
            <p className="text-gray-400">
              Please verify your email address to access this page. We've sent a verification link to{' '}
              <span className="font-medium text-white">{user.email}</span>
            </p>
          </div>
          <div className="bg-[#141A1E] border border-[#233037] rounded-lg p-4">
            <p className="text-sm text-gray-400">
              Check your inbox and click the verification link to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated users shouldn't see auth pages
  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Convenience components
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} fallbackToModal={true}>
      {children}
    </ProtectedRoute>
  );
}

export function RequireVerification({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requireVerification={true}>
      {children}
    </ProtectedRoute>
  );
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
