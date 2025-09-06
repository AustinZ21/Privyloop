/**
 * Token lifecycle management service
 * Handles token revocation, TTL enforcement, and cleanup
 */

import { Database, getDb } from '../database';
import { verification } from '../database/schema/auth-tables';
import { users } from '../database/schema/users';
import { eq, and, lt, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export class TokenManager {
  constructor(private db: Database) {}

  /**
   * Revoke previous active tokens and create new verification token
   * Ensures only one active token per user+purpose combination
   */
  async issueVerificationToken(
    email: string, 
    purpose: 'email_verification' | 'password_reset' = 'email_verification'
  ): Promise<string> {
    const tokenValue = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL
    
    // Find user by email
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Transaction to ensure atomicity: revoke old tokens then create new one
    return await this.db.transaction(async (tx) => {
      if (user) {
        // Revoke existing active tokens for this user+purpose
        await tx
          .update(verification)
          .set({ 
            status: 'revoked',
            revokedAt: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(verification.userId, user.id),
              eq(verification.purpose, purpose),
              eq(verification.status, 'active')
            )
          );
      }

      // Create new token
      const [newToken] = await tx
        .insert(verification)
        .values({
          id: `token_${randomBytes(16).toString('hex')}`,
          identifier: email,
          value: tokenValue,
          purpose,
          status: 'active',
          userId: user?.id || null,
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return tokenValue;
    });
  }

  /**
   * Validate and consume a verification token
   */
  async validateAndConsumeToken(
    tokenValue: string,
    purpose: 'email_verification' | 'password_reset' = 'email_verification'
  ): Promise<{ valid: boolean; email?: string; expired?: boolean }> {
    const [token] = await this.db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.value, tokenValue),
          eq(verification.purpose, purpose),
          eq(verification.status, 'active')
        )
      )
      .limit(1);

    if (!token) {
      return { valid: false };
    }

    // Check expiration
    if (token.expiresAt < new Date()) {
      // Mark as expired
      await this.db
        .update(verification)
        .set({ 
          status: 'expired',
          updatedAt: new Date()
        })
        .where(eq(verification.id, token.id));
      
      return { valid: false, expired: true };
    }

    // Mark as used
    await this.db
      .update(verification)
      .set({ 
        status: 'used',
        usedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(verification.id, token.id));

    return { 
      valid: true, 
      email: token.identifier 
    };
  }

  /**
   * Cleanup expired tokens (run as scheduled job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db
      .update(verification)
      .set({ 
        status: 'expired',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(verification.status, 'active'),
          lt(verification.expiresAt, new Date())
        )
      )
      .returning({ id: verification.id });

    return result.length;
  }

  /**
   * Revoke all active tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db
      .update(verification)
      .set({ 
        status: 'revoked',
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(verification.userId, userId),
          eq(verification.status, 'active')
        )
      );
  }

  /**
   * Get token status for debugging
   */
  async getTokenStatus(tokenValue: string): Promise<{
    exists: boolean;
    status?: string;
    expiresAt?: Date;
    email?: string;
  }> {
    const [token] = await this.db
      .select({
        status: verification.status,
        expiresAt: verification.expiresAt,
        email: verification.identifier
      })
      .from(verification)
      .where(eq(verification.value, tokenValue))
      .limit(1);

    if (!token) {
      return { exists: false };
    }

    return {
      exists: true,
      status: token.status,
      expiresAt: token.expiresAt,
      email: token.email
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager(getDb());

// For testing
export const createTokenManager = (db: Database) => new TokenManager(db);