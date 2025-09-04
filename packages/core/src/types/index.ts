// Core types for the PrivyLoop platform
export type DeploymentMode = 'self-hosted' | 'cloud';

export interface FeatureFlags {
  billing: boolean;
  multiTenant: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  ssoIntegration: boolean;
  apiAccess: boolean;
}

export interface PlatformConfig {
  deploymentMode: DeploymentMode;
  features: FeatureFlags;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Platform {
  id: string;
  name: string;
  domain: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface PrivacySettings {
  id: string;
  userId: string;
  platformId: string;
  settings: Record<string, any>;
  lastScrapeDate: Date;
  changeDetected: boolean;
}