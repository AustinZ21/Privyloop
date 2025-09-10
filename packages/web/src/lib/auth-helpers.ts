/**
 * Authentication helpers for API routes
 * Provides session validation and role-based access control
 */

import { NextRequest } from 'next/server';
import { createAuth } from '@privyloop/core/auth';

// Create auth instance for session validation
const auth = createAuth({
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
});

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified: boolean;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });

    if (!session?.user) {
      return null;
    }

    const role = (session.user as any).role ?? 'user';
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role, // Default to 'user' role
      emailVerified: session.user.emailVerified,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * Validate admin access for protected endpoints
 */
export async function validateAdminAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  if (!user.emailVerified) {
    return {
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
        status: 403,
      },
    };
  }

  if (!isAdmin(user)) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_PRIVILEGES',
        message: 'Admin access required',
        status: 403,
      },
    };
  }

  return {
    success: true,
    user,
  };
}
