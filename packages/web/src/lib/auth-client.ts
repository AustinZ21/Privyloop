/**
 * Better Auth Client Integration
 * Type-safe authentication hooks and utilities
 * Military-grade session management with cross-tab sync
 */

import { createAuthClient } from "better-auth/react";
import type { Session } from "@privyloop/core/auth";
import { getFeatureFlags, getAuthFeatureFlags } from "@privyloop/core/features";

function computeBaseURL(): string {
  // Browser: use same-origin to keep cookies/sessions working
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // SSR: prefer explicit env, else platform-provided URL
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_AUTH_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3030';
  throw new Error('authClient baseURL is missing in production. Set NEXT_PUBLIC_APP_URL.');
}

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: computeBaseURL(),
});

// Export auth hooks and utilities from Better Auth
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  resetPassword,
} = authClient;

// Enhanced authentication state management
export interface AuthState {
  user: Session["user"] | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  subscriptionTier: 'free' | 'pro' | 'premium' | 'enterprise';
  availableFeatures: ReturnType<typeof getAuthFeatureFlags>;
}


// Cross-tab authentication sync
export class AuthSync {
  private static instance: AuthSync;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; data: any }) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('privyloop-auth');
        this.channel.addEventListener('message', this.handleMessage.bind(this));
      } catch (error) {
        console.warn('BroadcastChannel not supported, falling back to localStorage');
        this.setupLocalStorageSync();
      }
    }
  }

  static getInstance(): AuthSync {
    if (!AuthSync.instance) {
      AuthSync.instance = new AuthSync();
    }
    return AuthSync.instance;
  }

  private handleMessage(event: MessageEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event.data);
      } catch (error) {
        console.error('AuthSync listener error:', error);
      }
    });
  }

  private setupLocalStorageSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (event.key === 'privyloop-auth-sync') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          this.listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error('LocalStorage auth sync error:', error);
        }
      }
    });
  }

  broadcast(type: string, data: any) {
    const message = { type, data, timestamp: Date.now() };
    
    if (this.channel) {
      this.channel.postMessage(message);
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage
      localStorage.setItem('privyloop-auth-sync', JSON.stringify(message));
    }
  }

  subscribe(listener: (event: { type: string; data: any }) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

// Enhanced session hook with cross-tab sync and feature flags
export function useAuthState(): AuthState {
  const sessionQuery = useSession();
  const [syncState, setSyncState] = React.useState<Partial<AuthState>>({});

  React.useEffect(() => {
    const authSync = AuthSync.getInstance();
    
    const unsubscribe = authSync.subscribe((event) => {
      switch (event.type) {
        case 'session-changed':
          setSyncState(prev => ({ ...prev, ...event.data }));
          break;
        case 'logout':
          setSyncState({
            user: null,
            session: null,
            isAuthenticated: false,
            isEmailVerified: false,
            subscriptionTier: 'free',
          });
          break;
      }
    });

    return unsubscribe;
  }, []);

  const user = sessionQuery.data?.user || syncState.user;
  const session = sessionQuery.data || syncState.session;
  const isAuthenticated = !!user;
  const isEmailVerified = user?.emailVerified ?? false;
  const subscriptionTier = (user as any)?.subscriptionTier || 'free';

  // Get available features based on deployment mode and subscription
  const availableFeatures = React.useMemo(() => {
    return getAuthFeatureFlags(undefined, subscriptionTier);
  }, [subscriptionTier]);

  return {
    user: user || null,
    session: session || null,
    isLoading: sessionQuery.isPending,
    isAuthenticated,
    isEmailVerified,
    subscriptionTier,
    availableFeatures,
  };
}

// Email verification utilities
export interface EmailVerificationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export async function resendVerificationEmail(
  email: string, 
  options: EmailVerificationOptions = {}
): Promise<boolean> {
  try {
    // Send email verification via API call
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }
    
    options.onSuccess?.();
    
    // Broadcast to other tabs
    const authSync = AuthSync.getInstance();
    authSync.broadcast('verification-sent', { email });
    
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send verification email';
    options.onError?.(message);
    return false;
  }
}

// Enhanced sign out with cross-tab sync
export async function signOutEverywhere(): Promise<void> {
  try {
    await signOut();
    
    // Broadcast logout to all tabs
    const authSync = AuthSync.getInstance();
    authSync.broadcast('logout', {});
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('privyloop-auth-cache');
    }
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Password strength validation
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0-4 scale (weak to strong)
  isValid: boolean;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const feedback: string[] = [];
  if (!requirements.length) feedback.push('At least 8 characters');
  if (!requirements.uppercase) feedback.push('One uppercase letter');
  if (!requirements.lowercase) feedback.push('One lowercase letter');
  if (!requirements.number) feedback.push('One number');
  if (!requirements.special) feedback.push('One special character');

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = Math.min(metRequirements, 4) as PasswordStrength['score'];
  const isValid = metRequirements >= 4; // Require at least 4/5 criteria

  return {
    score,
    isValid,
    feedback,
    requirements,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Redirect utilities
export function getAuthRedirectUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check localStorage first (set by protected routes)
  const storedRedirect = localStorage.getItem('auth-redirect-url');
  if (storedRedirect) {
    return storedRedirect;
  }
  
  // Check URL parameters
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || params.get('callbackUrl');
}

export function setAuthRedirectUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for persistence across modal interactions
  localStorage.setItem('auth-redirect-url', url);
  
  // Also set in URL for direct page access
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('redirect', url);
  window.history.replaceState({}, '', currentUrl.toString());
}

export function clearAuthRedirectUrl(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth-redirect-url');
  
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('redirect');
  window.history.replaceState({}, '', currentUrl.toString());
}

// Password strength alias for backward compatibility
export const getPasswordStrength = validatePasswordStrength;

// Import React for hooks
import React from 'react';