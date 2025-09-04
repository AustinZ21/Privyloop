/**
 * Audit Logs schema
 * Comprehensive logging for privacy changes, user actions, and system events
 */

import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, index, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { platforms } from './platforms';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Event identification
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventCategory: varchar('event_category', { length: 30 }).notNull(),
  
  // Context
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  platformId: uuid('platform_id').references(() => platforms.id, { onDelete: 'set null' }),
  
  // Event details
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: varchar('resource_id', { length: 100 }),
  
  // Event data
  eventData: jsonb('event_data').$type<{
    before?: any;
    after?: any;
    changes?: { [key: string]: { old: any; new: any; } };
    metadata?: { [key: string]: any };
    requestInfo?: {
      userAgent?: string;
      ip?: string;
      sessionId?: string;
    };
  }>().default({}),
  
  // Result and status
  success: boolean('success').default(true).notNull(),
  errorMessage: text('error_message'),
  statusCode: integer('status_code'),
  
  // Privacy and compliance
  severity: varchar('severity', { length: 20 })
    .default('info')
    .notNull(), // 'debug', 'info', 'warn', 'error', 'critical'
  sensitiveData: boolean('sensitive_data').default(false).notNull(),
  
  // Timing
  duration: integer('duration_ms'), // Action duration in milliseconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Retention
  retentionPolicy: varchar('retention_policy', { length: 20 })
    .default('1y'), // '30d', '90d', '1y', '7y', 'forever'
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  eventTypeIdx: index('audit_logs_event_type_idx').on(table.eventType, table.createdAt),
  userEventIdx: index('audit_logs_user_idx').on(table.userId, table.createdAt),
  platformEventIdx: index('audit_logs_platform_idx').on(table.platformId, table.createdAt),
  severityIdx: index('audit_logs_severity_idx').on(table.severity, table.createdAt),
  categoryIdx: index('audit_logs_category_idx').on(table.eventCategory, table.createdAt),
  retentionIdx: index('audit_logs_retention_idx').on(table.expiresAt),
}));

// Zod schemas for validation
export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  eventType: z.string().min(1).max(50),
  eventCategory: z.string().min(1).max(30),
  action: z.string().min(1).max(100),
  resource: z.string().max(100).optional(),
  resourceId: z.string().max(100).optional(),
  severity: z.enum(['debug', 'info', 'warn', 'error', 'critical']),
  statusCode: z.number().min(100).max(599).optional(),
  duration: z.number().min(0).optional(),
  retentionPolicy: z.enum(['30d', '90d', '1y', '7y', 'forever']),
});

export const selectAuditLogSchema = createSelectSchema(auditLogs);

// Type exports
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AuditEventData = NonNullable<AuditLog['eventData']>;

// Event categories and types
export const AUDIT_CATEGORIES = {
  USER: 'user',
  PRIVACY: 'privacy',
  PLATFORM: 'platform',
  SYSTEM: 'system',
  SECURITY: 'security',
  API: 'api',
} as const;

export const AUDIT_EVENT_TYPES = {
  // User events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Privacy events
  PRIVACY_SCAN_STARTED: 'privacy.scan.started',
  PRIVACY_SCAN_COMPLETED: 'privacy.scan.completed',
  PRIVACY_SCAN_FAILED: 'privacy.scan.failed',
  PRIVACY_SETTINGS_CHANGED: 'privacy.settings.changed',
  PRIVACY_TEMPLATE_UPDATED: 'privacy.template.updated',
  
  // Platform events
  PLATFORM_CONNECTED: 'platform.connected',
  PLATFORM_DISCONNECTED: 'platform.disconnected',
  PLATFORM_SCAN_ENABLED: 'platform.scan.enabled',
  PLATFORM_SCAN_DISABLED: 'platform.scan.disabled',
  
  // System events
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_ERROR: 'system.error',
  DATABASE_MIGRATION: 'system.database.migration',
  
  // Security events
  AUTH_FAILED: 'security.auth.failed',
  PERMISSION_DENIED: 'security.permission.denied',
  SUSPICIOUS_ACTIVITY: 'security.suspicious.activity',
  DATA_EXPORT: 'security.data.export',
  DATA_DELETION: 'security.data.deletion',
  
  // API events
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',
  RATE_LIMIT_EXCEEDED: 'api.rate_limit.exceeded',
} as const;

export type AuditCategory = typeof AUDIT_CATEGORIES[keyof typeof AUDIT_CATEGORIES];
export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];

// Helper functions for creating audit logs
export const createAuditLog = (params: {
  eventType: AuditEventType;
  eventCategory: AuditCategory;
  action: string;
  userId?: string;
  platformId?: string;
  resource?: string;
  resourceId?: string;
  eventData?: AuditEventData;
  success?: boolean;
  errorMessage?: string;
  statusCode?: number;
  severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  duration?: number;
}): NewAuditLog => {
  return {
    ...params,
    severity: params.severity || 'info',
    success: params.success ?? true,
    eventData: params.eventData || {},
    retentionPolicy: params.eventCategory === AUDIT_CATEGORIES.SECURITY ? '7y' : '1y',
  };
};