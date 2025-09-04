/**
 * Platforms table schema
 * Defines supported privacy platforms (Google, Facebook, LinkedIn, etc.)
 */

import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const platforms = pgTable('platforms', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Platform identification
  name: varchar('name', { length: 100 }).notNull().unique(), // 'Google', 'Facebook', etc.
  slug: varchar('slug', { length: 50 }).notNull().unique(), // 'google', 'facebook', etc.
  domain: varchar('domain', { length: 255 }).notNull(), // 'google.com'
  
  // Platform metadata
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  
  // Privacy page configuration
  privacyPageUrls: jsonb('privacy_page_urls').$type<{
    main: string;
    ads?: string;
    data?: string;
    activity?: string;
    [key: string]: string | undefined;
  }>().notNull(),
  
  // Scraping configuration
  scrapingConfig: jsonb('scraping_config').$type<{
    selectors: {
      [settingKey: string]: {
        selector: string;
        type: 'toggle' | 'radio' | 'select' | 'text';
        expectedValues?: string[];
      };
    };
    waitForSelectors?: string[];
    customScript?: string;
    rateLimit?: {
      requestsPerMinute: number;
      cooldownMinutes: number;
    };
  }>().notNull(),
  
  // Extension integration
  manifestPermissions: jsonb('manifest_permissions').$type<string[]>()
    .default([])
    .notNull(),
  
  // Platform status
  isActive: boolean('is_active').default(true).notNull(),
  isSupported: boolean('is_supported').default(true).notNull(),
  requiresAuth: boolean('requires_auth').default(true).notNull(),
  
  // Version tracking
  configVersion: varchar('config_version', { length: 20 }).notNull().default('1.0.0'),
  lastUpdatedBy: varchar('last_updated_by', { length: 100 }),
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertPlatformSchema = createInsertSchema(platforms, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().min(1).max(255),
  configVersion: z.string().regex(/^\d+\.\d+\.\d+$/),

  // JSONB overrides to ensure parsed types match column $type
  privacyPageUrls: z
    .object({
      main: z.string(),
      ads: z.string().optional(),
      data: z.string().optional(),
      activity: z.string().optional(),
    })
    .catchall(z.string().optional()),

  scrapingConfig: z.object({
    selectors: z.record(
      z.object({
        selector: z.string(),
        type: z.enum(['toggle', 'radio', 'select', 'text']),
        expectedValues: z.array(z.string()).optional(),
      })
    ),
    waitForSelectors: z.array(z.string()).optional(),
    customScript: z.string().optional(),
    rateLimit: z
      .object({
        requestsPerMinute: z.number(),
        cooldownMinutes: z.number(),
      })
      .optional(),
  }),

  manifestPermissions: z.array(z.string()),
});

export const selectPlatformSchema = createSelectSchema(platforms);
export const updatePlatformSchema = insertPlatformSchema.partial().omit({ id: true, createdAt: true });

// Type exports
export type Platform = typeof platforms.$inferSelect;
export type NewPlatform = typeof platforms.$inferInsert;
export type UpdatePlatform = z.infer<typeof updatePlatformSchema>;
export type PlatformScrapingConfig = NonNullable<Platform['scrapingConfig']>;
export type PlatformPrivacyUrls = NonNullable<Platform['privacyPageUrls']>;

// Supported platforms constants
export const SUPPORTED_PLATFORMS = [
  'google',
  'facebook', 
  'linkedin',
  'openai',
  'anthropic',
  'microsoft',
  'twitter',
  'instagram'
] as const;

export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];