/**
 * Platform Registry System
 * Manages server-side platform configurations and scraping rules
 * Serves configurations to browser extension and manages platform versioning
 */

import { type Database } from '../database/config';
import { eq, and } from 'drizzle-orm';
import { platforms } from '../database/schema';
import { type Platform, type PlatformScrapingConfig, SUPPORTED_PLATFORMS } from '../database/schema/platforms';
import { type ExtensionConfig } from './types';

export interface PlatformRegistryConfig {
  defaultRateLimit: { requestsPerMinute: number; cooldownMinutes: number };
  configCacheMinutes: number;
}

export class PlatformRegistry {
  private configCache: Map<string, { config: Platform; expiresAt: number }> = new Map();
  private readonly config: PlatformRegistryConfig;

  constructor(
    private db: Database,
    config?: Partial<PlatformRegistryConfig>
  ) {
    this.config = {
      defaultRateLimit: { requestsPerMinute: 10, cooldownMinutes: 1 },
      configCacheMinutes: 5,
      ...config,
    };
  }

  /**
   * Get platform configuration by ID (with caching)
   */
  async getPlatformConfig(platformId: string): Promise<Platform | null> {
    // Check cache first
    const cached = this.configCache.get(platformId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.config;
    }

    // Fetch from database
    const [platform] = await this.db
      .select()
      .from(platforms)
      .where(and(
        eq(platforms.id, platformId),
        eq(platforms.isActive, true)
      ))
      .limit(1);

    if (platform) {
      // Cache the result
      this.configCache.set(platformId, {
        config: platform,
        expiresAt: Date.now() + (this.config.configCacheMinutes * 60 * 1000),
      });
    }

    return platform || null;
  }

  /**
   * Get platform configuration by slug
   */
  async getPlatformBySlug(slug: string): Promise<Platform | null> {
    const [platform] = await this.db
      .select()
      .from(platforms)
      .where(and(
        eq(platforms.slug, slug),
        eq(platforms.isActive, true),
        eq(platforms.isSupported, true)
      ))
      .limit(1);

    return platform || null;
  }

  /**
   * Get all active platforms
   */
  async getActivePlatforms(): Promise<Platform[]> {
    return await this.db
      .select()
      .from(platforms)
      .where(and(
        eq(platforms.isActive, true),
        eq(platforms.isSupported, true)
      ));
  }

  /**
   * Get extension configuration for a platform
   */
  async getExtensionConfig(platformId: string): Promise<ExtensionConfig | null> {
    const platform = await this.getPlatformConfig(platformId);
    if (!platform) {
      return null;
    }

    return {
      platformId: platform.id,
      scrapingConfig: platform.scrapingConfig,
      permissions: platform.manifestPermissions,
      rateLimit: platform.scrapingConfig.rateLimit || this.config.defaultRateLimit,
      version: platform.configVersion,
    };
  }

  /**
   * Register a new platform configuration
   */
  async registerPlatform(platformData: Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Validate platform data
    this.validatePlatformConfig(platformData);

    const [newPlatform] = await this.db
      .insert(platforms)
      .values({
        ...platformData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: platforms.id });

    // Clear cache to ensure fresh data
    this.clearCache();

    return newPlatform.id;
  }

  /**
   * Update platform configuration
   */
  async updatePlatform(
    platformId: string, 
    updates: Partial<Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    if (updates.scrapingConfig) {
      this.validateScrapingConfig(updates.scrapingConfig);
    }

    const result = await this.db
      .update(platforms)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, platformId))
      .returning({ id: platforms.id });

    // Clear cache entry
    this.configCache.delete(platformId);

    return result.length > 0;
  }

  /**
   * Deactivate platform
   */
  async deactivatePlatform(platformId: string): Promise<boolean> {
    const result = await this.db
      .update(platforms)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, platformId))
      .returning({ id: platforms.id });

    this.configCache.delete(platformId);
    return result.length > 0;
  }

  /**
   * Initialize default platform configurations
   */
  async initializeDefaultPlatforms(): Promise<void> {
    const defaultConfigs = await this.getDefaultPlatformConfigs();
    
    for (const config of defaultConfigs) {
      // Check if platform already exists
      const existing = await this.getPlatformBySlug(config.slug);
      if (!existing) {
        await this.registerPlatform(config);
      }
    }
  }

  /**
   * Get default platform configurations
   */
  private async getDefaultPlatformConfigs(): Promise<Array<Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>>> {
    return [
      {
        name: 'Google',
        slug: 'google',
        domain: 'google.com',
        description: 'Google privacy and ad settings',
        logoUrl: 'https://www.google.com/favicon.ico',
        websiteUrl: 'https://myaccount.google.com/privacy',
        privacyPageUrls: {
          main: 'https://myaccount.google.com/privacy',
          ads: 'https://adssettings.google.com/',
          activity: 'https://myactivity.google.com/',
          data: 'https://takeout.google.com/',
        },
        scrapingConfig: {
          selectors: {
            'web-activity': {
              selector: '[data-id="WAA"] [role="switch"]',
              type: 'toggle',
            },
            'location-history': {
              selector: '[data-id="LH"] [role="switch"]',
              type: 'toggle',
            },
            'ad-personalization': {
              selector: '[data-id="AdsPersonalization"] [role="switch"]',
              type: 'toggle',
            },
            'youtube-history': {
              selector: '[data-id="YTH"] [role="switch"]',
              type: 'toggle',
            },
          },
          waitForSelectors: ['[role="switch"]'],
          rateLimit: {
            requestsPerMinute: 5,
            cooldownMinutes: 2,
          },
        },
        manifestPermissions: [
          '*://myaccount.google.com/*',
          '*://adssettings.google.com/*',
          '*://myactivity.google.com/*',
        ],
        isActive: true,
        isSupported: true,
        requiresAuth: true,
        configVersion: '1.0.0',
      },
      {
        name: 'Facebook',
        slug: 'facebook',
        domain: 'facebook.com',
        description: 'Facebook privacy and ad preferences',
        logoUrl: 'https://www.facebook.com/favicon.ico',
        websiteUrl: 'https://www.facebook.com/privacy/explanation',
        privacyPageUrls: {
          main: 'https://www.facebook.com/settings/?tab=privacy',
          ads: 'https://www.facebook.com/adpreferences',
        },
        scrapingConfig: {
          selectors: {
            'future-posts': {
              selector: '[data-testid="privacy_selector"] [role="button"]',
              type: 'select',
              expectedValues: ['Public', 'Friends', 'Only me'],
            },
            'friend-requests': {
              selector: '[data-testid="friend_requests_selector"] [role="button"]',
              type: 'select',
              expectedValues: ['Everyone', 'Friends of friends'],
            },
            'ad-preferences': {
              selector: '[data-testid="ads_based_on_data"] [role="switch"]',
              type: 'toggle',
            },
          },
          waitForSelectors: ['[data-testid="privacy_selector"]'],
          rateLimit: {
            requestsPerMinute: 3,
            cooldownMinutes: 5,
          },
        },
        manifestPermissions: [
          '*://www.facebook.com/*',
          '*://facebook.com/*',
        ],
        isActive: true,
        isSupported: true,
        requiresAuth: true,
        configVersion: '1.0.0',
      },
      {
        name: 'LinkedIn',
        slug: 'linkedin',
        domain: 'linkedin.com',
        description: 'LinkedIn privacy settings',
        logoUrl: 'https://www.linkedin.com/favicon.ico',
        websiteUrl: 'https://www.linkedin.com/psettings/',
        privacyPageUrls: {
          main: 'https://www.linkedin.com/psettings/',
        },
        scrapingConfig: {
          selectors: {
            'public-profile-visibility': {
              selector: '[data-control-name="public_profile"] input[type="radio"]:checked',
              type: 'radio',
              expectedValues: ['public', 'limited'],
            },
            'activity-broadcasts': {
              selector: '[data-control-name="activity_feed"] input[type="checkbox"]',
              type: 'toggle',
            },
          },
          waitForSelectors: ['[data-control-name="public_profile"]'],
          rateLimit: {
            requestsPerMinute: 5,
            cooldownMinutes: 3,
          },
        },
        manifestPermissions: [
          '*://www.linkedin.com/*',
        ],
        isActive: true,
        isSupported: true,
        requiresAuth: true,
        configVersion: '1.0.0',
      },
      {
        name: 'OpenAI',
        slug: 'openai',
        domain: 'openai.com',
        description: 'OpenAI account privacy settings',
        logoUrl: 'https://openai.com/favicon.ico',
        websiteUrl: 'https://platform.openai.com/account',
        privacyPageUrls: {
          main: 'https://platform.openai.com/account/data-controls',
        },
        scrapingConfig: {
          selectors: {
            'data-controls': {
              selector: '[data-testid="data-controls-toggle"]',
              type: 'toggle',
            },
            'conversation-history': {
              selector: '[data-testid="chat-history-toggle"]',
              type: 'toggle',
            },
          },
          waitForSelectors: ['[data-testid="data-controls-toggle"]'],
          rateLimit: {
            requestsPerMinute: 10,
            cooldownMinutes: 1,
          },
        },
        manifestPermissions: [
          '*://platform.openai.com/*',
          '*://chat.openai.com/*',
        ],
        isActive: true,
        isSupported: true,
        requiresAuth: true,
        configVersion: '1.0.0',
      },
    ];
  }

  /**
   * Validate platform configuration
   */
  private validatePlatformConfig(platformData: Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!SUPPORTED_PLATFORMS.includes(platformData.slug as any)) {
      throw new Error(`Unsupported platform slug: ${platformData.slug}`);
    }

    if (!platformData.privacyPageUrls.main) {
      throw new Error('Main privacy page URL is required');
    }

    this.validateScrapingConfig(platformData.scrapingConfig);
  }

  /**
   * Validate scraping configuration
   */
  private validateScrapingConfig(config: PlatformScrapingConfig): void {
    if (!config.selectors || Object.keys(config.selectors).length === 0) {
      throw new Error('At least one selector must be defined');
    }

    for (const [key, selectorConfig] of Object.entries(config.selectors)) {
      if (!selectorConfig.selector) {
        throw new Error(`Selector for ${key} is required`);
      }

      if (!['toggle', 'radio', 'select', 'text'].includes(selectorConfig.type)) {
        throw new Error(`Invalid selector type for ${key}: ${selectorConfig.type}`);
      }
    }

    if (config.rateLimit) {
      if (config.rateLimit.requestsPerMinute < 1 || config.rateLimit.requestsPerMinute > 60) {
        throw new Error('Rate limit requests per minute must be between 1 and 60');
      }

      if (config.rateLimit.cooldownMinutes < 0 || config.rateLimit.cooldownMinutes > 60) {
        throw new Error('Rate limit cooldown must be between 0 and 60 minutes');
      }
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.configCache.size,
      // TODO: Implement hit rate tracking
    };
  }

  /**
   * Validate platform permissions for extension
   */
  validatePermissions(platformId: string, requestedUrls: string[]): boolean {
    const cached = this.configCache.get(platformId);
    if (!cached) {
      return false;
    }

    const allowedPatterns = cached.config.manifestPermissions;
    
    return requestedUrls.every(url => {
      return allowedPatterns.some(pattern => {
        // Simple pattern matching - convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url);
      });
    });
  }

  /**
   * Get platforms requiring specific permissions
   */
  async getPlatformsWithPermissions(permissions: string[]): Promise<Platform[]> {
    const allPlatforms = await this.getActivePlatforms();
    
    return allPlatforms.filter(platform => {
      return permissions.some(permission => {
        return platform.manifestPermissions.some(manifestPermission => {
          const regexPattern = manifestPermission
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(permission);
        });
      });
    });
  }
}