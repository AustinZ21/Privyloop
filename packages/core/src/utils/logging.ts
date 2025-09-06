/**
 * PII-safe logging utilities for authentication flows
 * Masks sensitive information while preserving debugging capability
 */

import { randomUUID } from 'crypto';

/**
 * Masks email addresses for logging while preserving some structure
 * user@domain.com -> u***@d***.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '[invalid-email]';
  }

  try {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return '[malformed-email]';
    }

    const maskedLocal = localPart.length > 1 
      ? `${localPart[0]}***` 
      : '*';
      
    const maskedDomain = domain.length > 1 
      ? `${domain[0]}***.${domain.split('.').pop()}` 
      : '***';

    return `${maskedLocal}@${maskedDomain}`;
  } catch (error) {
    return '[invalid-email]';
  }
}

/**
 * Masks sensitive URLs by removing tokens/secrets
 * https://app.com/verify?token=abc123 -> https://app.com/verify?token=[REDACTED]
 */
export function maskUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '[invalid-url]';
  }

  try {
    const urlObj = new URL(url);
    const sensitiveParams = ['token', 'code', 'secret', 'key', 'password'];
    
    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });

    return urlObj.toString();
  } catch (error) {
    return '[invalid-url]';
  }
}

/**
 * Generates correlation ID for tracking requests across logs
 * without exposing sensitive information
 */
export function generateCorrelationId(prefix = 'auth'): string {
  return `${prefix}_${randomUUID().substring(0, 8)}`;
}

/**
 * Creates PII-safe auth log entry
 */
export interface AuthLogData {
  action: string;
  userId?: string;
  email?: string;
  timestamp?: string;
  correlationId?: string;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export function createAuthLog(data: AuthLogData): Record<string, any> {
  const correlationId = data.correlationId || generateCorrelationId();
  
  return {
    action: data.action,
    correlationId,
    userId: data.userId || '[unknown]',
    email: data.email ? maskEmail(data.email) : '[no-email]',
    timestamp: data.timestamp || new Date().toISOString(),
    success: data.success ?? false,
    ...(data.error && { error: data.error }),
    ...(data.metadata && { metadata: data.metadata }),
  };
}

/**
 * Safe console logging for development
 * Automatically masks PII and adds correlation tracking
 */
export function logAuth(data: AuthLogData): void {
  if (process.env.NODE_ENV === 'production') {
    // In production, use structured logging service
    // For now, we'll still log but with full masking
    console.log(JSON.stringify(createAuthLog(data)));
  } else {
    // Development: More readable but still masked
    console.log('[AUTH]', createAuthLog(data));
  }
}