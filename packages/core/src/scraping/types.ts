/**
 * Core types and interfaces for the privacy scraping engine
 * Defines the structure for template-based privacy data extraction
 */

import { z } from 'zod';
import { type PrivacySettingsStructure, type PrivacyTemplate } from '../database/schema/privacy-templates';
import { type UserPrivacySettings } from '../database/schema/privacy-snapshots';
import { type PlatformScrapingConfig } from '../database/schema/platforms';

// Scraping method types
export type ScrapingMethod = 'extension' | 'firecrawl' | 'ocr';
export type ScanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';

// Privacy setting types
export type SettingType = 'toggle' | 'radio' | 'select' | 'text';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ChangeType = 'user' | 'platform' | 'unknown';

// Core scraping interfaces
export interface ScrapingContext {
  userId: string;
  platformId: string;
  method: ScrapingMethod;
  userAgent?: string;
  viewport?: { width: number; height: number };
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ScrapingResult {
  success: boolean;
  data?: ExtractedPrivacyData;
  error?: ScrapingError;
  metadata: ScrapingMetadata;
}

export interface ExtractedPrivacyData {
  platformId: string;
  extractedSettings: UserPrivacySettings;
  templateMatch?: {
    templateId: string;
    version: string;
    confidenceScore: number;
  };
  raw?: {
    html?: string;
    screenshots?: string[];
    metadata?: Record<string, any>;
  };
}

export interface ScrapingError {
  code: string;
  message: string;
  type: 'network' | 'parsing' | 'authentication' | 'rate_limit' | 'unknown';
  retryable: boolean;
  details?: Record<string, any>;
}

export interface ScrapingMetadata {
  scanId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  method: ScrapingMethod;
  userAgent?: string;
  completionRate: number;
  confidenceScore: number;
  elementsFound: number;
  elementsExpected: number;
}

// Platform-specific scraper interface
export interface PlatformScraper {
  platform: string;
  version: string;
  
  // Core methods
  canScrape(context: ScrapingContext): Promise<boolean>;
  scrape(context: ScrapingContext): Promise<ScrapingResult>;
  validateSettings(settings: UserPrivacySettings): boolean;
  
  // Template operations
  generateTemplate(data: ExtractedPrivacyData): PrivacySettingsStructure;
  matchTemplate(template: PrivacyTemplate, data: ExtractedPrivacyData): number;
  
  // Configuration
  getRequiredPermissions(): string[];
  getRateLimits(): { requestsPerMinute: number; cooldownMinutes: number };
}

// Template system interfaces
export interface TemplateComparison {
  similarity: number;
  differences: TemplateDifference[];
  needsNewTemplate: boolean;
}

export interface TemplateDifference {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
  impact: 'breaking' | 'minor' | 'cosmetic';
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savings: number;
}

// Template system operations
export interface TemplateSystem {
  // Template management
  findMatchingTemplate(platformId: string, data: ExtractedPrivacyData): Promise<PrivacyTemplate | null>;
  createNewTemplate(platformId: string, data: ExtractedPrivacyData): Promise<PrivacyTemplate>;
  compareTemplates(template1: PrivacyTemplate, template2: PrivacyTemplate): TemplateComparison;
  
  // Storage optimization
  compressUserSettings(template: PrivacyTemplate, userSettings: UserPrivacySettings): UserPrivacySettings;
  decompressUserSettings(template: PrivacyTemplate, compressedSettings: UserPrivacySettings): UserPrivacySettings;
  calculateCompressionStats(template: PrivacyTemplate, userSettings: UserPrivacySettings): CompressionStats;
  
  // Version management
  migrateUserSettings(oldTemplate: PrivacyTemplate, newTemplate: PrivacyTemplate, userSettings: UserPrivacySettings): UserPrivacySettings;
}

// Extension integration interfaces
export interface ExtensionMessage {
  type: 'scan_request' | 'scan_result' | 'config_request' | 'config_response' | 'error';
  payload: any;
  requestId: string;
  timestamp: number;
}

export interface ExtensionConfig {
  platformId: string;
  scrapingConfig: PlatformScrapingConfig;
  permissions: string[];
  rateLimit: { requestsPerMinute: number; cooldownMinutes: number };
  version: string;
}

// Validation schemas
export const scrapingContextSchema = z.object({
  userId: z.string().min(1),
  platformId: z.string().uuid(),
  method: z.enum(['extension', 'firecrawl', 'ocr']),
  userAgent: z.string().optional(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  cookies: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
});

export const scrapingResultSchema = z.object({
  success: z.boolean(),
  data: z.object({
    platformId: z.string().uuid(),
    extractedSettings: z.record(z.record(z.any())),
    templateMatch: z.object({
      templateId: z.string().uuid(),
      version: z.string(),
      confidenceScore: z.number().min(0).max(1),
    }).optional(),
    raw: z.object({
      html: z.string().optional(),
      screenshots: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    }).optional(),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    type: z.enum(['network', 'parsing', 'authentication', 'rate_limit', 'unknown']),
    retryable: z.boolean(),
    details: z.record(z.any()).optional(),
  }).optional(),
  metadata: z.object({
    scanId: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    duration: z.number().positive(),
    method: z.enum(['extension', 'firecrawl', 'ocr']),
    userAgent: z.string().optional(),
    completionRate: z.number().min(0).max(1),
    confidenceScore: z.number().min(0).max(1),
    elementsFound: z.number().nonnegative(),
    elementsExpected: z.number().positive(),
  }),
});

export const extensionMessageSchema = z.object({
  type: z.enum(['scan_request', 'scan_result', 'config_request', 'config_response', 'error']),
  payload: z.any(),
  requestId: z.string().min(1),
  timestamp: z.number().positive(),
});

// Type guards
export const isScrapingError = (result: ScrapingResult): result is ScrapingResult & { error: ScrapingError } => {
  return !result.success && !!result.error;
};

export const isScrapingSuccess = (result: ScrapingResult): result is ScrapingResult & { data: ExtractedPrivacyData } => {
  return result.success && !!result.data;
};

// Constants
export const SCRAPING_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  FIRECRAWL: 60000, // 60 seconds
  OCR: 120000, // 2 minutes
} as const;

export const CONFIDENCE_THRESHOLDS = {
  TEMPLATE_MATCH: 0.85, // Minimum confidence to use existing template
  DATA_EXTRACTION: 0.7, // Minimum confidence for extracted data
  SETTING_DETECTION: 0.6, // Minimum confidence for individual settings
} as const;

export const COMPRESSION_TARGETS = {
  SIZE_REDUCTION: 0.95, // Target 95% size reduction
  MAX_TEMPLATE_SIZE: 50 * 1024, // 50KB max template size
  MAX_USER_SETTINGS: 2 * 1024, // 2KB max user settings
} as const;