/**
 * Verification token validation utility
 * Shared between send-verification and verify-email endpoints
 */

import { tokenManager } from '@privyloop/core/services/token-management';

/**
 * Validate and consume verification token
 * @param token Token to validate
 * @param email Email to match against token
 * @returns Promise<boolean> True if token is valid and consumed
 */
export async function validateVerificationToken(token: string, email: string): Promise<boolean> {
  const result = await tokenManager.validateAndConsumeToken(token, 'email_verification');
  return result.valid && result.email === email;
}