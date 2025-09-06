/**
 * Send Verification Email API Endpoint
 * Resends email verification with proper token management
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@privyloop/core/services/email';
import { tokenManager } from '@privyloop/core/services/token-management';
import { randomBytes } from 'crypto';

// Rate limiter to prevent email bombing attacks
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

// Idempotency key storage (15 minute window)
const idempotencyCache = new Map<string, { response: any; expires: number }>();

// Cleanup expired entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limiter
  for (const [key, limit] of rateLimiter.entries()) {
    if (limit.resetTime <= now) {
      rateLimiter.delete(key);
    }
  }
  
  // Clean idempotency cache
  for (const [key, data] of idempotencyCache.entries()) {
    if (data.expires <= now) {
      idempotencyCache.delete(key);
    }
  }
}, 600000);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check for idempotency key
    const idempotencyKey = request.headers.get('x-idempotency-key');
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expires > Date.now()) {
        return NextResponse.json(cached.response);
      }
    }

    // Rate limiting: Max 3 attempts per hour per IP + email combination
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `${clientIp}:${email}`;
    const now = Date.now();
    const limit = rateLimiter.get(key);

    if (limit && limit.resetTime > now) {
      if (limit.count >= 3) {
        const errorResponse = { error: 'Too many requests. Please try again later.' };
        
        // Cache rate limit response if idempotency key provided
        if (idempotencyKey) {
          idempotencyCache.set(idempotencyKey, {
            response: errorResponse,
            expires: now + 900000 // 15 minutes
          });
        }
        
        return NextResponse.json(errorResponse, { status: 429 });
      }
      limit.count++;
    } else {
      rateLimiter.set(key, { count: 1, resetTime: now + 3600000 }); // 1 hour window
    }

    // Generate verification token using token manager
    const token = await tokenManager.issueVerificationToken(email, 'email_verification');
    // Compute base URL - prefer environment vars, fail in production if missing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_AUTH_URL || 
                   process.env.APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
                   (process.env.NODE_ENV !== 'production' ? 'http://localhost:3030' : 
                    (() => { throw new Error('baseURL missing in production. Set NEXT_PUBLIC_APP_URL.'); })());
    const verificationUrl = `${baseUrl}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`;
    
    // Send verification email using the email service
    const success = await emailService.sendVerificationEmail(email, verificationUrl);
    
    const response = success 
      ? { success: true }
      : { error: 'Failed to send verification email' };
    
    // Cache successful response if idempotency key provided
    if (idempotencyKey && success) {
      idempotencyCache.set(idempotencyKey, {
        response,
        expires: now + 900000 // 15 minutes
      });
    }
    
    return NextResponse.json(response, { status: success ? 200 : 500 });
    
  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

