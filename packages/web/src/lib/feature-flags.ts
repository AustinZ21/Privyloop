/**
 * Feature Flags - Local fallback implementation
 * Provides feature flag support when core module is unavailable
 */

export interface RecaptchaFeatureFlags {
  enabled: boolean;
  threshold: number;
  siteKey?: string;
}

export interface FeatureFlags {
  recaptcha?: RecaptchaFeatureFlags;
}

// Fallback feature flags when core module is not available
function getFallbackFeatureFlags(): FeatureFlags {
  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudDeployment = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE === 'cloud';
  
  return {
    recaptcha: {
      enabled: isProduction && isCloudDeployment && !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      threshold: parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5'),
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    },
  };
}

// Try to use core module, fallback to local implementation
export function getFeatureFlags(): FeatureFlags {
  try {
    // Try to import from core module
    const { getFeatureFlags: coreGetFeatureFlags } = require('@privyloop/core/features');
    const coreFlags = coreGetFeatureFlags();
    
    // Merge with fallback flags for any missing properties
    const fallbackFlags = getFallbackFeatureFlags();
    
    return {
      ...fallbackFlags,
      ...coreFlags,
      recaptcha: {
        ...fallbackFlags.recaptcha,
        ...coreFlags.recaptcha,
      },
    };
  } catch (error) {
    // Core module not available, use fallback
    console.warn('Core features module not available, using fallback feature flags');
    return getFallbackFeatureFlags();
  }
}

// Environment-based feature detection
export function detectDeploymentMode(): 'cloud' | 'self-hosted' {
  return process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE === 'cloud' ? 'cloud' : 'self-hosted';
}

export function isEnterpriseFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  const featureConfig = flags[feature];
  
  if (typeof featureConfig === 'object' && featureConfig !== null) {
    return 'enabled' in featureConfig ? !!featureConfig.enabled : true;
  }
  
  return !!featureConfig;
}