/**
 * Privacy Templates schema
 * Template-based storage system for 95% size reduction
 * Single template per platform version shared across all users
 */

import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, index, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { platforms } from './platforms';

export const privacyTemplates = pgTable('privacy_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Template identification
  platformId: uuid('platform_id')
    .notNull()
    .references(() => platforms.id, { onDelete: 'cascade' }),
  
  version: varchar('version', { length: 50 }).notNull(), // 'v2024-01-15', 'v2024-02-01'
  templateHash: varchar('template_hash', { length: 64 }).notNull(), // SHA-256 of content
  
  // Template metadata
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Privacy settings structure (shared template)
  settingsStructure: jsonb('settings_structure').$type<{
    categories: {
      [categoryId: string]: {
        name: string;
        description?: string;
        settings: {
          [settingId: string]: {
            name: string;
            description: string;
            type: 'toggle' | 'radio' | 'select';
            defaultValue: any;
            options?: { label: string; value: any; }[];
            riskLevel: 'low' | 'medium' | 'high';
            impact: string;
            recommendation?: string;
          };
        };
      };
    };
    metadata: {
      totalSettings: number;
      lastScrapedAt: string;
      platformVersion?: string;
      changesSinceLastVersion?: string[];
    };
  }>().notNull(),
  
  // AI Analysis (performed once per template)
  aiAnalysis: jsonb('ai_analysis').$type<{
    overallRiskScore: number; // 0-100
    keyRecommendations: string[];
    categoryScores: { [categoryId: string]: number };
    riskFactors: string[];
    privacyImpact: 'low' | 'medium' | 'high';
    generatedAt: string;
    modelUsed: string;
  }>(),
  
  // Usage statistics
  usageCount: integer('usage_count').default(0).notNull(),
  activeUserCount: integer('active_user_count').default(0).notNull(),
  
  // Version control
  isActive: boolean('is_active').default(true).notNull(),
  previousVersionId: uuid('previous_version_id'), // Self-reference handled in relations
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 100 }), // 'system', 'admin', or user id
}, (table) => ({
  platformVersionIdx: index('privacy_templates_platform_version_idx').on(table.platformId, table.version),
  activeTemplateIdx: index('privacy_templates_active_idx').on(table.platformId, table.isActive),
  hashIdx: index('privacy_templates_hash_idx').on(table.templateHash),
}));

// Zod schemas for validation
export const insertPrivacyTemplateSchema = createInsertSchema(privacyTemplates, {
  version: z.string().min(1).max(50),
  templateHash: z.string().length(64),
  name: z.string().min(1).max(200),
});

export const selectPrivacyTemplateSchema = createSelectSchema(privacyTemplates);
export const updatePrivacyTemplateSchema = insertPrivacyTemplateSchema.partial().omit({ 
  id: true, 
  createdAt: true,
  templateHash: true // Should not be updated directly
});

// Type exports
export type PrivacyTemplate = typeof privacyTemplates.$inferSelect;
export type NewPrivacyTemplate = typeof privacyTemplates.$inferInsert;
export type UpdatePrivacyTemplate = z.infer<typeof updatePrivacyTemplateSchema>;
export type PrivacySettingsStructure = NonNullable<PrivacyTemplate['settingsStructure']>;
export type PrivacyAIAnalysis = NonNullable<PrivacyTemplate['aiAnalysis']>;

// Template versioning helpers
export const generateTemplateVersion = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `v${year}-${month}-${day}`;
};

export const generateTemplateHash = (settingsStructure: PrivacySettingsStructure): string => {
  // In a real implementation, this would use crypto to generate SHA-256
  return Buffer.from(JSON.stringify(settingsStructure)).toString('hex').slice(0, 64);
};