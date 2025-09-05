import type { DeploymentMode, FeatureFlags, PlatformConfig } from '../types';

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

/**
 * Detects the deployment mode from environment variables
 */
export function detectDeploymentMode(): DeploymentMode {
  const mode = process.env.DEPLOYMENT_MODE as DeploymentMode;
  if (mode === 'self-hosted' || mode === 'cloud') {
    return mode;
  }
  // Default to self-hosted for security
  return 'self-hosted';
}

/**
 * Gets feature flags based on deployment mode
 */
export function getFeatureFlags(deploymentMode?: DeploymentMode): FeatureFlags {
  const mode = deploymentMode || detectDeploymentMode();
  
  if (mode === 'cloud') {
    return {
      billing: true,
      multiTenant: true,
      advancedAnalytics: true,
      customBranding: true,
      ssoIntegration: true,
      apiAccess: true,
      // Authentication features - cloud deployment
      emailAuth: true,
      socialAuth: true,
      emailVerification: true,
      managedEmail: true,
      sessionLimits: true,
      advancedSecurity: true,
      auditLogs: true,
    };
  }
  
  // Self-hosted mode - more limited feature set
  return {
    billing: false,
    multiTenant: false,
    advancedAnalytics: true,
    customBranding: false,
    ssoIntegration: false,
    apiAccess: true,
    // Authentication features - self-hosted deployment
    emailAuth: true,
    socialAuth: true,
    emailVerification: true,
    managedEmail: false, // Users provide own SMTP
    sessionLimits: false, // No Redis for session tracking
    advancedSecurity: false, // No enterprise security features
    auditLogs: false, // Basic logging only
  };
}

/**
 * Checks if a feature is enabled for the current deployment mode
 */
export function isFeatureEnabled(feature: keyof FeatureFlags, deploymentMode?: DeploymentMode): boolean {
  const features = getFeatureFlags(deploymentMode);
  return features[feature];
}

/**
 * Gets the complete platform configuration
 */
export function getPlatformConfig(): PlatformConfig {
  const deploymentMode = detectDeploymentMode();
  const features = getFeatureFlags(deploymentMode);
  
  return {
    deploymentMode,
    features,
    version: process.env.npm_package_version || '0.1.0',
    environment: (process.env.NODE_ENV as any) || 'development',
  };
}

/**
 * Gets authentication-specific feature flags based on subscription tier
 */
export function getAuthFeatureFlags(
  deploymentMode?: DeploymentMode, 
  subscriptionTier: SubscriptionTier = 'free'
): Pick<FeatureFlags, 'emailAuth' | 'socialAuth' | 'emailVerification' | 'managedEmail' | 'sessionLimits' | 'advancedSecurity' | 'auditLogs'> {
  const mode = deploymentMode || detectDeploymentMode();
  const baseFlags = getFeatureFlags(mode);
  
  // Base authentication features (available to all tiers)
  const authFlags = {
    emailAuth: baseFlags.emailAuth,
    socialAuth: baseFlags.socialAuth,
    emailVerification: baseFlags.emailVerification,
    managedEmail: baseFlags.managedEmail,
    sessionLimits: false,
    advancedSecurity: false,
    auditLogs: false,
  };

  // Subscription tier enhancements (only for cloud deployment)
  if (mode === 'cloud') {
    switch (subscriptionTier) {
      case 'pro':
        authFlags.sessionLimits = true;
        break;
      case 'premium':
        authFlags.sessionLimits = true;
        authFlags.advancedSecurity = true;
        break;
      case 'enterprise':
        authFlags.sessionLimits = true;
        authFlags.advancedSecurity = true;
        authFlags.auditLogs = true;
        break;
    }
  }

  return authFlags;
}

/**
 * Runtime feature flag component wrapper
 * Use this for conditional rendering based on features
 */
export function withFeatureFlag<T>(
  feature: keyof FeatureFlags,
  component: T,
  fallback?: T
): T | undefined {
  if (isFeatureEnabled(feature)) {
    return component;
  }
  return fallback;
}