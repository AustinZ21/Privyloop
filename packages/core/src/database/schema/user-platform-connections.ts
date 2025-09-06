/**
 * User Platform Connections schema
 * Manages user connections to privacy platforms
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { platforms } from './platforms';

export const userPlatformConnections = pgTable('user_platform_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Relationships
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id')
    .notNull()
    .references(() => platforms.id, { onDelete: 'cascade' }),
  
  // Connection metadata
  connectionName: varchar('connection_name', { length: 100 }), // User's custom name
  
  // Connection status
  isActive: boolean('is_active').default(true).notNull(),
  isAuthorized: boolean('is_authorized').default(false).notNull(),
  
  // Scanning configuration
  scanEnabled: boolean('scan_enabled').default(true).notNull(),
  scanFrequency: varchar('scan_frequency', { length: 20 })
    .default('weekly')
    .notNull(), // 'daily', 'weekly', 'manual'
  
  // Last scan information
  lastScanId: varchar('last_scan_id', { length: 100 }),
  lastScanAt: timestamp('last_scan_at'),
  lastScanStatus: varchar('last_scan_status', { length: 20 })
    .default('never'), // 'never', 'success', 'failed', 'partial'
  lastScanError: text('last_scan_error'),
  
  // Next scheduled scan
  nextScheduledScan: timestamp('next_scheduled_scan'),
  
  // Connection health
  consecutiveFailures: integer('consecutive_failures').default(0).notNull(),
  maxConsecutiveFailures: integer('max_consecutive_failures').default(5).notNull(),
  
  // Platform-specific settings
  platformSettings: jsonb('platform_settings').$type<{
    [key: string]: any; // Platform-specific configuration
  }>().default({}),
  
  // User preferences for this connection
  preferences: jsonb('preferences').$type<{
    notifications: {
      changeAlerts: boolean;
      scanResults: boolean;
      failures: boolean;
    };
    scanning: {
      includeInBulkScans: boolean;
      priority: 'low' | 'medium' | 'high';
    };
    privacy: {
      shareWithPlatform: boolean;
      includeInAnalytics: boolean;
    };
  }>().default({
    notifications: { changeAlerts: true, scanResults: false, failures: true },
    scanning: { includeInBulkScans: true, priority: 'medium' },
    privacy: { shareWithPlatform: false, includeInAnalytics: false },
  }),
  
  // Audit fields
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastModifiedAt: timestamp('last_modified_at').defaultNow().notNull(),
  
  // Disconnection tracking
  disconnectedAt: timestamp('disconnected_at'),
  disconnectionReason: varchar('disconnection_reason', { length: 100 }),
}, (table) => ({
  userPlatformIdx: index('user_connections_user_platform_idx').on(table.userId, table.platformId),
  activeConnectionsIdx: index('user_connections_active_idx').on(table.userId, table.isActive),
  scanScheduleIdx: index('user_connections_scan_schedule_idx').on(table.nextScheduledScan),
  scanEnabledIdx: index('user_connections_scan_enabled_idx').on(table.scanEnabled, table.nextScheduledScan),
}));

// Zod schemas for validation
export const insertUserPlatformConnectionSchema = createInsertSchema(userPlatformConnections, {
  connectionName: z.string().min(1).max(100).optional(),
  scanFrequency: z.enum(['daily', 'weekly', 'manual']),
  lastScanStatus: z.enum(['never', 'success', 'failed', 'partial']),
  consecutiveFailures: z.number().min(0),
  maxConsecutiveFailures: z.number().min(1),
});

export const selectUserPlatformConnectionSchema = createSelectSchema(userPlatformConnections);
export const updateUserPlatformConnectionSchema = insertUserPlatformConnectionSchema.partial().omit({ 
  id: true, 
  connectedAt: true 
});

// Type exports
export type UserPlatformConnection = typeof userPlatformConnections.$inferSelect;
export type NewUserPlatformConnection = typeof userPlatformConnections.$inferInsert;
export type UpdateUserPlatformConnection = z.infer<typeof updateUserPlatformConnectionSchema>;
export type ConnectionPreferences = NonNullable<UserPlatformConnection['preferences']>;
export type ConnectionPlatformSettings = NonNullable<UserPlatformConnection['platformSettings']>;

// Connection status helpers
export const CONNECTION_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning', // Some failures but not critical
  FAILING: 'failing', // Multiple consecutive failures
  DISCONNECTED: 'disconnected',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

// Calculate connection health
export const getConnectionHealth = (connection: UserPlatformConnection): ConnectionStatus => {
  if (!connection.isActive || connection.disconnectedAt) {
    return CONNECTION_STATUS.DISCONNECTED;
  }
  
  if (connection.consecutiveFailures >= connection.maxConsecutiveFailures) {
    return CONNECTION_STATUS.FAILING;
  }
  
  if (connection.consecutiveFailures > 0) {
    return CONNECTION_STATUS.WARNING;
  }
  
  return CONNECTION_STATUS.HEALTHY;
};