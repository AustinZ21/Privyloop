/**
 * Better Auth configuration for PrivyLoop
 * Multi-provider authentication with email verification
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../database";
import { emailService } from "../services/email";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg", // PostgreSQL
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async (data, url) => {
      const verificationUrl = typeof url === 'string' ? url : url?.url || '';
      const success = await emailService.sendVerificationEmail(data.user.email, verificationUrl);
      if (!success) {
        console.error(`Failed to send verification email to ${data.user.email}`);
        throw new Error('Failed to send verification email');
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
});

export type Session = typeof auth.$Infer.Session;