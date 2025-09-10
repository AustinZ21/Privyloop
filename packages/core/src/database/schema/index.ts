/**
 * Database schema exports
 * PrivyLoop comprehensive database architecture with template-based optimization
 */

// Schema exports
export * from './users';
export * from './platforms';
export * from './privacy-templates';
export * from './privacy-snapshots';
export * from './user-platform-connections';
export * from './audit-logs';
export * from './auth-tables';

// Schema relations
import { relations } from 'drizzle-orm';
import { users } from './users';
import { platforms } from './platforms';
import { privacyTemplates } from './privacy-templates';
import { privacySnapshots } from './privacy-snapshots';
import { userPlatformConnections } from './user-platform-connections';
import { auditLogs } from './audit-logs';
import { session, account, verification } from './auth-tables';

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  platformConnections: many(userPlatformConnections),
  privacySnapshots: many(privacySnapshots),
  auditLogs: many(auditLogs),
  // Better Auth relations
  sessions: many(session),
  accounts: many(account),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  userConnections: many(userPlatformConnections),
  privacyTemplates: many(privacyTemplates),
  privacySnapshots: many(privacySnapshots),
  auditLogs: many(auditLogs),
}));

export const privacyTemplatesRelations = relations(privacyTemplates, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [privacyTemplates.platformId],
    references: [platforms.id],
  }),
  previousVersion: one(privacyTemplates, {
    fields: [privacyTemplates.previousVersionId],
    references: [privacyTemplates.id],
  }),
  privacySnapshots: many(privacySnapshots),
}));

export const privacySnapshotsRelations = relations(privacySnapshots, ({ one }) => ({
  user: one(users, {
    fields: [privacySnapshots.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [privacySnapshots.platformId],
    references: [platforms.id],
  }),
  template: one(privacyTemplates, {
    fields: [privacySnapshots.templateId],
    references: [privacyTemplates.id],
  }),
}));

export const userPlatformConnectionsRelations = relations(userPlatformConnections, ({ one }) => ({
  user: one(users, {
    fields: [userPlatformConnections.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [userPlatformConnections.platformId],
    references: [platforms.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [auditLogs.platformId],
    references: [platforms.id],
  }),
}));

// Better Auth table relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

// Database schema object for Drizzle
export const schema = {
  users, // Consolidated user table (replaces separate 'user' table)
  platforms,
  privacyTemplates,
  privacySnapshots,
  userPlatformConnections,
  auditLogs,
  // Better Auth tables (using consolidated users table)
  session,
  account,
  verification,
  usersRelations,
  platformsRelations,
  privacyTemplatesRelations,
  privacySnapshotsRelations,
  userPlatformConnectionsRelations,
  auditLogsRelations,
  // Better Auth relations
  sessionRelations,
  accountRelations,
} as const;

// Type-safe schema type
export type DatabaseSchema = typeof schema;