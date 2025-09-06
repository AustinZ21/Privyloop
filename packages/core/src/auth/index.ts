/**
 * Better Auth configuration for PrivyLoop
 * Multi-provider authentication with email verification
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../database";
import { schema } from "../database/schema";
import { emailService } from "../services/email";
import { logAuth, maskUrl, generateCorrelationId } from "../utils/logging";

// Environment variables interface for type safety
interface AuthEnvVars {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  OAUTH_REDIRECT_BASE_URL?: string;
}

export function createAuth(env: AuthEnvVars = {}) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('BETTER_AUTH_SECRET is required in production');
      }
      return "development-only-secret-" + Math.random().toString(36);
    })(),
    baseURL: env.OAUTH_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3030",
    database: drizzleAdapter(getDb(), {
      provider: "pg", // PostgreSQL
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        }
      } : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          // Force consent prompt for security - ensures users see OAuth permissions
          extraParams: {
            prompt: "consent",
            access_type: "offline"
          }
        }
      } : {}),
      ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET ? {
        microsoft: {
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
        }
      } : {}),
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: 60 * 60 * 24, // 24 hours
      sendVerificationEmail: async (data, url) => {
        const verificationUrl = typeof url === 'string' ? url : url?.url || '';
        
        // Validate URL format
        try {
          new URL(verificationUrl);
        } catch (error) {
          console.error('Invalid verification URL format:', error);
          throw new Error('Invalid verification URL');
        }
        
        const correlationId = generateCorrelationId('email_verification');
        
        logAuth({
          action: 'send_verification_email',
          userId: data.user.id,
          email: data.user.email,
          correlationId,
          metadata: {
            urlMasked: maskUrl(verificationUrl),
            hasToken: verificationUrl.includes('token=')
          }
        });
        
        const success = await emailService.sendVerificationEmail(data.user.email, verificationUrl, correlationId);
        
        logAuth({
          action: 'verification_email_result',
          userId: data.user.id,
          email: data.user.email,
          correlationId,
          success
        });
        
        if (!success) {
          throw new Error('Failed to send verification email');
        }
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
    },
  });
}

// Default export with environment variables
export const auth = createAuth({
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  OAUTH_REDIRECT_BASE_URL: process.env.OAUTH_REDIRECT_BASE_URL,
});

export type Session = typeof auth.$Infer.Session;