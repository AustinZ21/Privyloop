/**
 * reCAPTCHA Verification API - Server-side token validation
 * Military-grade bot protection with enterprise features
 */

import { NextRequest, NextResponse } from 'next/server';

interface RecaptchaVerificationRequest {
  token: string;
  action: string;
  expectedAction?: string;
}

interface GoogleRecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { token, action, expectedAction }: RecaptchaVerificationRequest = await request.json();

    // Validate input
    if (!token || !action) {
      return NextResponse.json(
        { success: false, error: 'Token and action are required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA not configured' },
        { status: 500 }
      );
    }

    // Verify token with Google reCAPTCHA API
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verificationData = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verificationData,
    });

    if (!response.ok) {
      console.error('reCAPTCHA API request failed:', response.statusText);
      return NextResponse.json(
        { success: false, error: 'Verification service unavailable' },
        { status: 503 }
      );
    }

    const result: GoogleRecaptchaResponse = await response.json();

    // Check basic success
    if (!result.success) {
      console.warn('reCAPTCHA verification failed:', result['error-codes']);
      return NextResponse.json({
        success: false,
        error: 'reCAPTCHA verification failed',
        errorCodes: result['error-codes'],
      });
    }

    // Validate action matches expected action
    if (expectedAction && result.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${result.action}`);
      return NextResponse.json({
        success: false,
        error: 'Action mismatch',
        expectedAction,
        actualAction: result.action,
      });
    }

    // Get score threshold from environment or use default
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    
    // Check score threshold (reCAPTCHA v3)
    if (result.score < scoreThreshold) {
      console.warn(`reCAPTCHA score ${result.score} below threshold ${scoreThreshold}`);
      return NextResponse.json({
        success: false,
        error: 'Score below threshold',
        score: result.score,
        threshold: scoreThreshold,
      });
    }

    // Log successful verification (for monitoring)
    console.log(`reCAPTCHA verification successful: action=${result.action}, score=${result.score}`);

    return NextResponse.json({
      success: true,
      score: result.score,
      action: result.action,
      hostname: result.hostname,
    });

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for health checks)
export async function GET() {
  return NextResponse.json({
    status: 'reCAPTCHA verification endpoint is operational',
    timestamp: new Date().toISOString(),
  });
}