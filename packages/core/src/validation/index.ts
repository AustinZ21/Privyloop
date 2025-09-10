import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// Platform validation schemas
export const platformSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  domain: z.string().url(),
  iconUrl: z.string().url().optional(),
  isActive: z.boolean(),
});

export const createPlatformSchema = z.object({
  name: z.string().min(1).max(50),
  domain: z.string().url(),
  iconUrl: z.string().url().optional(),
});

// Privacy settings validation schemas
export const privacySettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platformId: z.string().uuid(),
  settings: z.record(z.any()),
  lastScrapeDate: z.date(),
  changeDetected: z.boolean(),
});

export const updatePrivacySettingsSchema = z.object({
  settings: z.record(z.any()),
  lastScrapeDate: z.date(),
  changeDetected: z.boolean(),
});

// Feature flag validation
export const deploymentModeSchema = z.enum(['self-hosted', 'cloud']);

export const featureFlagsSchema = z.object({
  billing: z.boolean(),
  multiTenant: z.boolean(),
  advancedAnalytics: z.boolean(),
  customBranding: z.boolean(),
  ssoIntegration: z.boolean(),
  apiAccess: z.boolean(),
});

// Environment validation
export const environmentSchema = z.enum(['development', 'staging', 'production']);

// Export types from schemas
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type Platform = z.infer<typeof platformSchema>;
export type CreatePlatform = z.infer<typeof createPlatformSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type UpdatePrivacySettings = z.infer<typeof updatePrivacySettingsSchema>;
export type DeploymentMode = z.infer<typeof deploymentModeSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type Environment = z.infer<typeof environmentSchema>;