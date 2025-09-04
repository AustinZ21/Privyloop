/**
 * Users table schema
 * Handles authentication, subscription tiers, and user preferences
 */

import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  
  // Authentication fields
  emailVerified: boolean('email_verified').default(false).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  
  // OAuth provider data
  providers: jsonb('providers').$type<{
    google?: { id: string; email: string; };
    github?: { id: string; username: string; };
    microsoft?: { id: string; email: string; };
  }>().default({}),
  
  // Subscription and limits
  subscriptionTier: varchar('subscription_tier', { length: 20 })
    .notNull()
    .default('free'), // 'free', 'pro', 'premium', 'enterprise'
  subscriptionStatus: varchar('subscription_status', { length: 20 })
    .default('active'), // 'active', 'cancelled', 'past_due', 'unpaid'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  
  // Usage tracking
  privacyCardsUsed: integer('privacy_cards_used').default(0).notNull(),
  lastScanAt: timestamp('last_scan_at'),
  
  // User preferences
  preferences: jsonb('preferences').$type<{
    notifications: {
      email: boolean;
      changeAlerts: boolean;
      weeklyDigest: boolean;
    };
    scanning: {
      frequency: 'daily' | 'weekly' | 'manual';
      autoScan: boolean;
    };
    privacy: {
      dataRetention: '30d' | '90d' | '1y' | 'forever';
      shareAnalytics: boolean;
    };
  }>().default({
    notifications: { email: true, changeAlerts: true, weeklyDigest: false },
    scanning: { frequency: 'weekly', autoScan: true },
    privacy: { dataRetention: '1y', shareAnalytics: false },
  }),
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  
  // Privacy and compliance
  gdprConsentAt: timestamp('gdpr_consent_at'),
  dataExportRequestedAt: timestamp('data_export_requested_at'),
  deletionRequestedAt: timestamp('deletion_requested_at'),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address'),
  subscriptionTier: z.enum(['free', 'pro', 'premium', 'enterprise']),
  subscriptionStatus: z.enum(['active', 'cancelled', 'past_due', 'unpaid']),
});

export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = insertUserSchema.partial().omit({ id: true, createdAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserPreferences = NonNullable<User['preferences']>;

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    privacyCards: 3,
    scanFrequency: 'weekly',
    advancedAnalytics: false,
    aiAgent: false,
  },
  pro: {
    privacyCards: Infinity,
    scanFrequency: 'daily',
    advancedAnalytics: true,
    aiAgent: false,
  },
  premium: {
    privacyCards: Infinity,
    scanFrequency: 'daily',
    advancedAnalytics: true,
    aiAgent: true,
  },
  enterprise: {
    privacyCards: Infinity,
    scanFrequency: 'daily',
    advancedAnalytics: true,
    aiAgent: true,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;