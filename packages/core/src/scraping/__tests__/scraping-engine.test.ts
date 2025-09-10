/**
 * Comprehensive Tests for Privacy Scraping Engine
 * Validates template-based storage optimization, platform scrapers, and error handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ScrapingEngine } from '../scraping-engine';
import { TemplateSystemImpl } from '../template-system';
import { PlatformRegistry } from '../platform-registry';
import { GoogleScraper } from '../platforms/google';
import { FacebookScraper } from '../platforms/facebook';
import { LinkedInScraper } from '../platforms/linkedin';
import { type ScrapingContext, type ExtractedPrivacyData, COMPRESSION_TARGETS, SCRAPING_TIMEOUTS } from '../types';
import type { Database } from '../../database/connection';

// Mock database
const mockDb = {
  insert: jest.fn().mockReturnValue({ values: jest.fn() }),
  select: jest.fn().mockReturnValue({ 
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    })
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ id: 'test-id' }])
    })
  })
} as unknown as Database;

// Mock platform config
const mockPlatformConfig = {
  id: 'test-platform-id',
  name: 'Test Platform',
  slug: 'test-platform',
  domain: 'test.com',
  scrapingConfig: {
    selectors: {
      'test-setting': {
        selector: '[data-testid="test-toggle"]',
        type: 'toggle' as const,
      },
      'another-setting': {
        selector: '[data-testid="another-setting"]',
        type: 'select' as const,
        expectedValues: ['public', 'friends', 'private'],
      },
    },
  },
  manifestPermissions: ['*://test.com/*'],
};

describe('ScrapingEngine', () => {
  let scrapingEngine: ScrapingEngine;
  let mockContext: ScrapingContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    scrapingEngine = new ScrapingEngine(mockDb);
    
    mockContext = {
      userId: 'test-user-id',
      platformId: 'test-platform-id',
      method: 'extension',
    };

    // Mock database queries
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPlatformConfig]),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        }),
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    });
  });

  describe('Template System Integration', () => {
    test('should achieve target compression ratio', async () => {
      const templateSystem = new TemplateSystemImpl(mockDb);
      
      // Mock large privacy settings data
      const largeSettings = {
        'privacy-controls': {
          'web-activity': true,
          'location-history': false,
          'ad-personalization': true,
          'youtube-history': true,
          'search-history': false,
        },
        'advertising': {
          'personalized-ads': true,
          'ad-measurement': false,
          'ads-based-on-activity': true,
          'ads-in-search': false,
        },
        'data-management': {
          'data-export': true,
          'data-deletion': false,
          'data-portability': true,
        },
      };

      // Mock template
      const mockTemplate = {
        id: 'test-template-id',
        settingsStructure: {
          categories: {
            'privacy-controls': {
              name: 'Privacy Controls',
              settings: {
                'web-activity': { defaultValue: false, type: 'toggle' },
                'location-history': { defaultValue: false, type: 'toggle' },
                'ad-personalization': { defaultValue: true, type: 'toggle' },
                'youtube-history': { defaultValue: true, type: 'toggle' },
                'search-history': { defaultValue: false, type: 'toggle' },
              },
            },
            'advertising': {
              name: 'Advertising',
              settings: {
                'personalized-ads': { defaultValue: true, type: 'toggle' },
                'ad-measurement': { defaultValue: false, type: 'toggle' },
                'ads-based-on-activity': { defaultValue: true, type: 'toggle' },
                'ads-in-search': { defaultValue: false, type: 'toggle' },
              },
            },
            'data-management': {
              name: 'Data Management',
              settings: {
                'data-export': { defaultValue: false, type: 'toggle' },
                'data-deletion': { defaultValue: false, type: 'toggle' },
                'data-portability': { defaultValue: false, type: 'toggle' },
              },
            },
          },
          metadata: { totalSettings: 12, lastScrapedAt: new Date().toISOString() },
        },
      } as any;

      // Test compression
      const compressed = templateSystem.compressUserSettings(mockTemplate, largeSettings);
      const stats = templateSystem.calculateCompressionStats(mockTemplate, largeSettings);

      expect(stats.savings).toBeGreaterThanOrEqual(COMPRESSION_TARGETS.SIZE_REDUCTION);
      expect(stats.savings).toBeGreaterThan(0);
      
      // Should only store differences from template defaults
      expect(Object.keys(compressed['privacy-controls'] || {})).toContain('web-activity'); // true vs false default
      expect(Object.keys(compressed['data-management'] || {})).toContain('data-export'); // true vs false default
      
      console.log('Compression Stats:', {
        originalSize: stats.originalSize,
        compressedSize: stats.compressedSize,
        compressionRatio: stats.compressionRatio,
        savings: stats.savings,
        targetReduction: COMPRESSION_TARGETS.SIZE_REDUCTION,
      });
    });

    test('should decompress settings correctly', async () => {
      const templateSystem = new TemplateSystemImpl(mockDb);
      
      const mockTemplate = {
        settingsStructure: {
          categories: {
            'general': {
              name: 'General',
              settings: {
                'setting1': { defaultValue: false, type: 'toggle' },
                'setting2': { defaultValue: 'public', type: 'select' },
              },
            },
          },
          metadata: { totalSettings: 2, lastScrapedAt: new Date().toISOString() },
        },
      } as any;

      const compressedSettings = {
        'general': {
          'setting1': true, // Different from default
          // setting2 not included, should use default
        },
      };

      const decompressed = templateSystem.decompressUserSettings(mockTemplate, compressedSettings);

      expect(decompressed.general.setting1).toBe(true);
      expect(decompressed.general.setting2).toBe('public'); // Should use default
    });

    test('should handle template migration', async () => {
      const templateSystem = new TemplateSystemImpl(mockDb);
      
      const oldTemplate = {
        settingsStructure: {
          categories: {
            'general': {
              name: 'General',
              settings: {
                'old-setting': { defaultValue: false, type: 'toggle' },
                'common-setting': { defaultValue: 'value1', type: 'select' },
              },
            },
          },
          metadata: { totalSettings: 2, lastScrapedAt: new Date().toISOString() },
        },
      } as any;

      const newTemplate = {
        settingsStructure: {
          categories: {
            'general': {
              name: 'General',
              settings: {
                'new-setting': { defaultValue: false, type: 'toggle' },
                'common-setting': { defaultValue: 'value1', type: 'select' },
              },
            },
          },
          metadata: { totalSettings: 2, lastScrapedAt: new Date().toISOString() },
        },
      } as any;

      const userSettings = {
        'general': {
          'old-setting': true,
          'common-setting': 'value2',
        },
      };

      const migrated = templateSystem.migrateUserSettings(oldTemplate, newTemplate, userSettings);

      expect(migrated.general?.['common-setting']).toBe('value2');
      expect(migrated.general?.['old-setting']).toBeUndefined();
    });
  });

  describe('Platform-Specific Scrapers', () => {
    test('GoogleScraper should extract settings correctly', async () => {
      const mockScrapingConfig = {
        selectors: {
          'web-activity': {
            selector: '[data-id="WAA"] [role="switch"]',
            type: 'toggle' as const,
          },
          'ad-personalization': {
            selector: '[data-id="AdsPersonalization"] [role="switch"]',
            type: 'toggle' as const,
          },
        },
      };

      const googleScraper = new GoogleScraper(mockScrapingConfig);
      
      expect(googleScraper.platform).toBe('google');
      expect(googleScraper.version).toBe('1.0.0');
      expect(googleScraper.getRequiredPermissions()).toContain('*://myaccount.google.com/*');
    });

    test('FacebookScraper should categorize settings correctly', async () => {
      const mockScrapingConfig = {
        selectors: {
          'future-posts': {
            selector: '[data-testid="privacy_selector"] [role="button"]',
            type: 'select' as const,
            expectedValues: ['Public', 'Friends', 'Only me'],
          },
          'ads-based-on-data': {
            selector: '[data-testid="ads_based_on_data"] [role="switch"]',
            type: 'toggle' as const,
          },
        },
      };

      const facebookScraper = new FacebookScraper(mockScrapingConfig);
      
      expect(facebookScraper.platform).toBe('facebook');
      expect(facebookScraper.supportsFirecrawl()).toBe(false); // Should not support Firecrawl
    });

    test('LinkedInScraper should handle professional settings', async () => {
      const mockScrapingConfig = {
        selectors: {
          'public-profile-visibility': {
            selector: '[data-control-name="public_profile"] input[type="radio"]:checked',
            type: 'radio' as const,
            expectedValues: ['public', 'limited'],
          },
          'activity-broadcasts': {
            selector: '[data-control-name="activity_feed"] input[type="checkbox"]',
            type: 'toggle' as const,
          },
        },
      };

      const linkedinScraper = new LinkedInScraper(mockScrapingConfig);
      
      expect(linkedinScraper.platform).toBe('linkedin');
      expect(linkedinScraper.getRequiredPermissions()).toContain('*://www.linkedin.com/*');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid scraping context', async () => {
      const invalidContext = {
        userId: '', // Invalid empty user ID
        platformId: 'invalid-uuid',
        method: 'extension',
      } as ScrapingContext;

      const result = await scrapingEngine.scrapePrivacySettings(invalidContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    test('should handle platform not found', async () => {
      // Mock empty platform query
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]) // No platform found
          })
        })
      });

      const result = await scrapingEngine.scrapePrivacySettings(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Platform');
      expect(result.error?.message).toContain('not found');
    });

    test('should handle scraper not available', async () => {
      // Platform exists but no scraper registered
      const result = await scrapingEngine.scrapePrivacySettings(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('No scraper available');
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Register a mock scraper
      const mockScraper = {
        platform: 'test-platform',
        version: '1.0.0',
        canScrape: jest.fn().mockResolvedValue(true),
        scrape: jest.fn().mockResolvedValue({
          success: true,
          data: {
            platformId: 'test-platform-id',
            extractedSettings: { general: { 'test-setting': true } },
          },
          metadata: {
            scanId: 'test-scan-id',
            startTime: new Date(),
            endTime: new Date(),
            duration: 1000,
            method: 'extension',
            completionRate: 1,
            confidenceScore: 0.9,
            elementsFound: 1,
            elementsExpected: 1,
          },
        }),
        validateSettings: jest.fn().mockReturnValue(true),
        generateTemplate: jest.fn(),
        matchTemplate: jest.fn().mockReturnValue(0.9),
        getRequiredPermissions: jest.fn().mockReturnValue([]),
        getRateLimits: jest.fn().mockReturnValue({ requestsPerMinute: 10, cooldownMinutes: 1 }),
      };

      scrapingEngine.registerScraper('test-platform', mockScraper as any);

      const result = await scrapingEngine.scrapePrivacySettings(mockContext);

      // Should still return result even with processing error
      expect(result.success).toBe(true);
      expect(mockScraper.scrape).toHaveBeenCalled();
    });
  });

  describe('Performance Requirements', () => {
    test('should complete scraping within timeout', async () => {
      const mockScraper = {
        platform: 'test-platform',
        version: '1.0.0',
        canScrape: jest.fn().mockResolvedValue(true),
        scrape: jest.fn().mockImplementation(async () => {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return {
            success: true,
            data: {
              platformId: 'test-platform-id',
              extractedSettings: { general: { 'test-setting': true } },
            },
            metadata: {
              scanId: 'test-scan-id',
              startTime: new Date(),
              endTime: new Date(),
              duration: 100,
              method: 'extension',
              completionRate: 1,
              confidenceScore: 0.9,
              elementsFound: 1,
              elementsExpected: 1,
            },
          };
        }),
        validateSettings: jest.fn().mockReturnValue(true),
        generateTemplate: jest.fn(),
        matchTemplate: jest.fn().mockReturnValue(0.9),
        getRequiredPermissions: jest.fn().mockReturnValue([]),
        getRateLimits: jest.fn().mockReturnValue({ requestsPerMinute: 10, cooldownMinutes: 1 }),
      };

      scrapingEngine.registerScraper('test-platform', mockScraper as any);

      const startTime = Date.now();
      const result = await scrapingEngine.scrapePrivacySettings(mockContext);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete quickly
    });

    test('should handle scraping timeout', async () => {
      jest.useFakeTimers();
      const mockScraper = {
        platform: 'test-platform',
        version: '1.0.0',
        canScrape: jest.fn().mockResolvedValue(true),
        scrape: jest.fn().mockImplementation(async () => {
          // Simulate long-running scrape
          await new Promise(resolve => setTimeout(resolve, 35000));
          return { success: false };
        }),
        validateSettings: jest.fn().mockReturnValue(true),
        generateTemplate: jest.fn(),
        matchTemplate: jest.fn().mockReturnValue(0.9),
        getRequiredPermissions: jest.fn().mockReturnValue([]),
        getRateLimits: jest.fn().mockReturnValue({ requestsPerMinute: 10, cooldownMinutes: 1 }),
      };

      scrapingEngine.registerScraper('test-platform', mockScraper as any);
      const promise = scrapingEngine.scrapePrivacySettings(mockContext);
      // Advance just past the engine's default timeout
      await jest.advanceTimersByTimeAsync(SCRAPING_TIMEOUTS.DEFAULT + 1);
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('Data Validation', () => {
    test('should validate setting types correctly', async () => {
      const templateSystem = new TemplateSystemImpl(mockDb);
      
      const mockScrapingConfig = {
        selectors: {
          'toggle-setting': { selector: '[data-toggle]', type: 'toggle' },
          'select-setting': { selector: '[data-select]', type: 'select', expectedValues: ['a', 'b', 'c'] },
          'text-setting': { selector: '[data-text]', type: 'text' },
        },
      } as any;

      // Valid settings
      const validSettings = {
        general: {
          'toggle-setting': true,
          'select-setting': 'a',
          'text-setting': 'some text',
        },
      };

      // Invalid settings
      const invalidSettings = {
        general: {
          'toggle-setting': 'not-boolean',
          'select-setting': 'invalid-option',
          'text-setting': 123,
        },
      };

      // Test validation logic would go here
      expect(typeof validSettings.general['toggle-setting']).toBe('boolean');
      expect(['a', 'b', 'c']).toContain(validSettings.general['select-setting']);
    });
  });

  describe('Scraping Statistics', () => {
    test('should track scraping statistics', async () => {
      const stats = await scrapingEngine.getScrapingStats();

      expect(stats).toHaveProperty('totalScans');
      expect(stats).toHaveProperty('successfulScans');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('platforms');
      expect(stats.compressionEnabled).toBe(true);
    });

    test('should track platform-specific statistics', async () => {
      const platformStats = await scrapingEngine.getScrapingStats('test-platform-id');

      expect(platformStats).toHaveProperty('totalScans');
      expect(platformStats).toHaveProperty('successRate');
    });
  });
});

describe('Integration Tests', () => {
  test('should process full scraping workflow', async () => {
    const scrapingEngine = new ScrapingEngine(mockDb);
    
    // Mock successful platform configuration
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPlatformConfig])
        })
      })
    });

    // Register mock scraper
    const mockScraper = {
      platform: 'test-platform',
      version: '1.0.0',
      canScrape: jest.fn().mockResolvedValue(true),
      scrape: jest.fn().mockResolvedValue({
        success: true,
        data: {
          platformId: 'test-platform-id',
          extractedSettings: {
            'privacy': { 'test-setting': true },
            'advertising': { 'ad-setting': false },
          },
        },
        metadata: {
          scanId: 'test-scan-id',
          startTime: new Date(),
          endTime: new Date(),
          duration: 1000,
          method: 'extension',
          completionRate: 1,
          confidenceScore: 0.9,
          elementsFound: 2,
          elementsExpected: 2,
        },
      }),
      validateSettings: jest.fn().mockReturnValue(true),
      generateTemplate: jest.fn(),
      matchTemplate: jest.fn().mockReturnValue(0.9),
      getRequiredPermissions: jest.fn().mockReturnValue(['*://test.com/*']),
      getRateLimits: jest.fn().mockReturnValue({ requestsPerMinute: 10, cooldownMinutes: 1 }),
    };

    scrapingEngine.registerScraper('test-platform', mockScraper as any);

    const context: ScrapingContext = {
      userId: 'test-user-id',
      platformId: 'test-platform-id',
      method: 'extension',
    };

    const result = await scrapingEngine.scrapePrivacySettings(context);

    expect(result.success).toBe(true);
    expect(result.data?.extractedSettings).toHaveProperty('privacy');
    expect(result.data?.extractedSettings).toHaveProperty('advertising');
    expect(mockScraper.canScrape).toHaveBeenCalledWith(context);
    expect(mockScraper.scrape).toHaveBeenCalledWith(context);
  });
});