import {
  detectDeploymentMode,
  getFeatureFlags,
  isFeatureEnabled,
  getPlatformConfig,
  withFeatureFlag,
} from '../index';

// Mock environment variables
const mockEnv = (env: Partial<NodeJS.ProcessEnv>) => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });
  afterEach(() => {
    process.env = originalEnv;
  });
};

describe('Feature Flag System', () => {
  describe('detectDeploymentMode', () => {
    mockEnv({ DEPLOYMENT_MODE: undefined });

    it('should default to self-hosted when no environment variable is set', () => {
      expect(detectDeploymentMode()).toBe('self-hosted');
    });

    it('should return self-hosted when DEPLOYMENT_MODE is set to self-hosted', () => {
      process.env.DEPLOYMENT_MODE = 'self-hosted';
      expect(detectDeploymentMode()).toBe('self-hosted');
    });

    it('should return cloud when DEPLOYMENT_MODE is set to cloud', () => {
      process.env.DEPLOYMENT_MODE = 'cloud';
      expect(detectDeploymentMode()).toBe('cloud');
    });

    it('should default to self-hosted for invalid deployment mode', () => {
      process.env.DEPLOYMENT_MODE = 'invalid';
      expect(detectDeploymentMode()).toBe('self-hosted');
    });
  });

  describe('getFeatureFlags', () => {
    it('should return cloud features when deployment mode is cloud', () => {
      const features = getFeatureFlags('cloud');
      expect(features).toEqual({
        billing: true,
        multiTenant: true,
        advancedAnalytics: true,
        customBranding: true,
        ssoIntegration: true,
        apiAccess: true,
      });
    });

    it('should return self-hosted features when deployment mode is self-hosted', () => {
      const features = getFeatureFlags('self-hosted');
      expect(features).toEqual({
        billing: false,
        multiTenant: false,
        advancedAnalytics: true,
        customBranding: false,
        ssoIntegration: false,
        apiAccess: true,
      });
    });

    it('should detect deployment mode when not provided', () => {
      process.env.DEPLOYMENT_MODE = 'cloud';
      const features = getFeatureFlags();
      expect(features.billing).toBe(true);
      expect(features.multiTenant).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for billing in cloud mode', () => {
      expect(isFeatureEnabled('billing', 'cloud')).toBe(true);
    });

    it('should return false for billing in self-hosted mode', () => {
      expect(isFeatureEnabled('billing', 'self-hosted')).toBe(false);
    });

    it('should return true for apiAccess in both modes', () => {
      expect(isFeatureEnabled('apiAccess', 'cloud')).toBe(true);
      expect(isFeatureEnabled('apiAccess', 'self-hosted')).toBe(true);
    });

    it('should use detected deployment mode when not provided', () => {
      process.env.DEPLOYMENT_MODE = 'self-hosted';
      expect(isFeatureEnabled('billing')).toBe(false);
    });
  });

  describe('getPlatformConfig', () => {
    mockEnv({ 
      DEPLOYMENT_MODE: 'cloud',
      NODE_ENV: 'production',
      npm_package_version: '1.2.3'
    });

    it('should return complete platform configuration', () => {
      const config = getPlatformConfig();
      expect(config).toMatchObject({
        deploymentMode: 'cloud',
        features: expect.objectContaining({
          billing: true,
          multiTenant: true,
        }),
        version: '1.2.3',
        environment: 'production',
      });
    });

    it('should handle missing environment variables gracefully', () => {
      process.env = {};
      const config = getPlatformConfig();
      expect(config).toMatchObject({
        deploymentMode: 'self-hosted',
        version: '0.1.0',
        environment: 'development',
      });
    });
  });

  describe('withFeatureFlag', () => {
    const TestComponent = 'TestComponent';
    const FallbackComponent = 'FallbackComponent';

    it('should return component when feature is enabled', () => {
      const result = withFeatureFlag('apiAccess', TestComponent, FallbackComponent);
      expect(result).toBe(TestComponent);
    });

    it('should return fallback when feature is disabled', () => {
      const result = withFeatureFlag('billing', TestComponent, FallbackComponent, 'self-hosted');
      expect(result).toBe(FallbackComponent);
    });

    it('should return undefined when feature is disabled and no fallback provided', () => {
      const result = withFeatureFlag('billing', TestComponent, undefined, 'self-hosted');
      expect(result).toBeUndefined();
    });

    it('should work with different component types', () => {
      const ComponentFunction = () => 'rendered';
      const result = withFeatureFlag('advancedAnalytics', ComponentFunction, null);
      expect(result).toBe(ComponentFunction);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle undefined environment variables securely', () => {
      delete process.env.DEPLOYMENT_MODE;
      expect(detectDeploymentMode()).toBe('self-hosted');
    });

    it('should be case sensitive for deployment mode', () => {
      process.env.DEPLOYMENT_MODE = 'CLOUD';
      expect(detectDeploymentMode()).toBe('self-hosted');
    });

    it('should handle empty string deployment mode', () => {
      process.env.DEPLOYMENT_MODE = '';
      expect(detectDeploymentMode()).toBe('self-hosted');
    });

    it('should maintain feature flag consistency across calls', () => {
      const features1 = getFeatureFlags('cloud');
      const features2 = getFeatureFlags('cloud');
      expect(features1).toEqual(features2);
    });
  });
});