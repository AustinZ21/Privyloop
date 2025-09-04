import type { DeploymentMode, FeatureFlags, PlatformConfig } from '../types';

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