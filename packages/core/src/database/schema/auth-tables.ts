/**
 * Better Auth required database tables
 * These tables are required by Better Auth for authentication functionality
 */

import { pgTable, text, timestamp, boolean, integer, primaryKey, unique, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

// Session table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// Account table (for social providers)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  // Prevent duplicate provider accounts for the same external account
  accountProviderUnique: uniqueIndex('account_provider_unique').on(table.accountId, table.providerId),
}));

// Enhanced verification table with single active token constraints
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), // email address
  value: text("value").notNull(), // token value
  purpose: varchar("purpose", { length: 50 }).notNull().default('email_verification'), // verification type
  status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'used', 'expired', 'revoked'
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }), // link to user for constraints
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  revokedAt: timestamp("revokedAt"), // when token was revoked
  usedAt: timestamp("usedAt"), // when token was successfully used
}, (table) => ({
  // Index for efficient token lookups
  tokenValueIdx: index("verification_value_idx").on(table.value),
  // Index for cleanup queries
  statusExpiresIdx: index("verification_status_expires_idx").on(table.status, table.expiresAt),
  // Composite index for user+purpose+status for efficient active token queries
  userPurposeStatusIdx: index("verification_user_purpose_status_idx").on(table.userId, table.purpose, table.status),
}));