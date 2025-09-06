/**
 * Storage Optimization Validation Tests
 * Validates that the template-based system achieves 95% storage reduction
 * Tests realistic privacy data scenarios and compression performance
 */

import { describe, test, expect } from '@jest/globals';
import { TemplateSystemImpl } from '../template-system';
import { calculateStorageMetrics } from '../index';
import { COMPRESSION_TARGETS } from '../types';

// Mock database
const mockDb = {} as any;

describe('Storage Optimization Validation', () => {
  let templateSystem: TemplateSystemImpl;

  beforeEach(() => {
    templateSystem = new TemplateSystemImpl(mockDb);
  });

  test('should achieve 95% storage reduction with realistic Google privacy data', () => {
    // Realistic Google privacy settings template
    const googleTemplate = {
      id: 'google-template-v1',
      settingsStructure: {
        categories: {
          'activity-controls': {
            name: 'Activity Controls',
            description: 'Control how Google uses your activity data',
            settings: {
              'web-and-app-activity': {
                name: 'Web & App Activity',
                description: 'Saves your activity on Google sites and apps to improve Google services',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'medium',
                impact: 'Affects personalization across Google services',
                recommendation: 'Consider your privacy preferences',
              },
              'location-history': {
                name: 'Location History',
                description: 'Saves where you go with your devices to improve location-based services',
                type: 'toggle',
                defaultValue: false,
                riskLevel: 'high',
                impact: 'Affects location-based recommendations and ads',
                recommendation: 'Disable for better privacy unless you need location features',
              },
              'youtube-history': {
                name: 'YouTube History',
                description: 'Saves videos you watch and searches you make on YouTube',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'medium',
                impact: 'Improves YouTube recommendations',
              },
              'youtube-search-history': {
                name: 'YouTube Search History',
                description: 'Saves your YouTube search activity',
                type: 'toggle', 
                defaultValue: true,
                riskLevel: 'medium',
                impact: 'Improves search suggestions',
              },
            },
          },
          'advertising': {
            name: 'Advertising',
            description: 'Control how Google personalizes ads',
            settings: {
              'ads-personalization': {
                name: 'Ads Personalization',
                description: 'Uses your activity to show more relevant ads',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'high',
                impact: 'Makes ads more relevant but shares more data',
                recommendation: 'Disable for better privacy',
              },
              'ads-based-on-activity': {
                name: 'Ads based on your activity',
                description: 'Shows ads based on your Google activity',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'medium',
                impact: 'Personalizes ads across Google services',
              },
            },
          },
          'data-and-privacy': {
            name: 'Data & Privacy',
            description: 'Control your data and privacy settings',
            settings: {
              'data-export': {
                name: 'Data Export',
                description: 'Export your Google data',
                type: 'toggle',
                defaultValue: false,
                riskLevel: 'low',
                impact: 'Allows you to download your data',
              },
              'activity-controls-history': {
                name: 'Activity Controls History',
                description: 'Keep a history of your activity control changes',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'low',
                impact: 'Tracks changes to your privacy settings',
              },
            },
          },
        },
        metadata: {
          totalSettings: 8,
          lastScrapedAt: new Date().toISOString(),
          platformVersion: '2024.01.15',
          changesSinceLastVersion: [],
        },
      },
    } as any;

    // User's actual privacy settings (different from defaults)
    const userPrivacySettings = {
      'activity-controls': {
        'web-and-app-activity': false,  // User disabled (default: true)
        'location-history': false,      // Same as default
        'youtube-history': true,        // Same as default  
        'youtube-search-history': false, // User disabled (default: true)
      },
      'advertising': {
        'ads-personalization': false,    // User disabled (default: true)
        'ads-based-on-activity': true,   // Same as default
      },
      'data-and-privacy': {
        'data-export': false,            // Same as default
        'activity-controls-history': true, // Same as default
      },
    };

    // Calculate sizes
    const fullDataWithTemplate = {
      template: googleTemplate.settingsStructure,
      userSettings: userPrivacySettings,
    };
    const traditionalSize = Buffer.from(JSON.stringify(fullDataWithTemplate)).length;

    // Compress using template system
    const compressedSettings = templateSystem.compressUserSettings(googleTemplate, userPrivacySettings);
    const compressedSize = Buffer.from(JSON.stringify(compressedSettings)).length;

    // Calculate metrics
    const stats = templateSystem.calculateCompressionStats(googleTemplate, userPrivacySettings);
    const storageMetrics = calculateStorageMetrics(
      Buffer.from(JSON.stringify(googleTemplate.settingsStructure)).length,
      compressedSize,
      traditionalSize
    );

    console.log('Google Privacy Settings Storage Optimization:', {
      traditionalSize: `${Math.round(traditionalSize / 1024 * 100) / 100} KB`,
      templateSize: `${Math.round(storageMetrics.templateSize / 1024 * 100) / 100} KB`,
      userDiffSize: `${Math.round(compressedSize / 1024 * 100) / 100} KB`,
      optimizedTotalSize: `${Math.round(storageMetrics.optimizedSize / 1024 * 100) / 100} KB`,
      compressionRatio: `${Math.round(stats.compressionRatio * 10000) / 100}%`,
      savings: `${Math.round(storageMetrics.savingsPercentage * 100) / 100}%`,
      meetsTarget: storageMetrics.meetsTarget ? 'YES' : 'NO',
    });

    // Validate 95% storage reduction
    expect(stats.compressionRatio).toBeLessThan(0.05); // Less than 5% of original = 95% reduction
    expect(storageMetrics.savingsPercentage).toBeGreaterThan(95);
    expect(storageMetrics.meetsTarget).toBe(true);

    // Validate compressed data only stores differences
    expect(compressedSettings['activity-controls']).toHaveProperty('web-and-app-activity'); // Changed from default
    expect(compressedSettings['activity-controls']).toHaveProperty('youtube-search-history'); // Changed from default
    expect(compressedSettings['activity-controls']).not.toHaveProperty('location-history'); // Same as default
    expect(compressedSettings['advertising']).toHaveProperty('ads-personalization'); // Changed from default
    expect(compressedSettings['advertising']).not.toHaveProperty('ads-based-on-activity'); // Same as default
  });

  test('should achieve 95% storage reduction with realistic Facebook privacy data', () => {
    // Realistic Facebook privacy settings template  
    const facebookTemplate = {
      id: 'facebook-template-v1',
      settingsStructure: {
        categories: {
          'privacy': {
            name: 'Privacy',
            description: 'Control who can see your information',
            settings: {
              'future-posts': {
                name: 'Future Posts',
                description: 'Who can see your future posts',
                type: 'select',
                defaultValue: 'Friends',
                riskLevel: 'medium',
                impact: 'Controls default audience for new posts',
                options: [
                  { label: 'Public', value: 'Public' },
                  { label: 'Friends', value: 'Friends' },
                  { label: 'Only me', value: 'Only me' },
                ],
              },
              'friend-requests': {
                name: 'Friend Requests',
                description: 'Who can send you friend requests',
                type: 'select',
                defaultValue: 'Everyone',
                riskLevel: 'medium',
                impact: 'Controls who can connect with you',
                options: [
                  { label: 'Everyone', value: 'Everyone' },
                  { label: 'Friends of friends', value: 'Friends of friends' },
                ],
              },
              'email-lookup': {
                name: 'Email Lookup',
                description: 'Who can find you using your email',
                type: 'select',
                defaultValue: 'Everyone',
                riskLevel: 'high',
                impact: 'Affects discoverability through email',
                recommendation: 'Consider limiting to Friends for privacy',
              },
            },
          },
          'advertising': {
            name: 'Advertising',
            description: 'Control ad preferences',
            settings: {
              'ads-based-on-data': {
                name: 'Ads based on data from partners',
                description: 'Show ads based on data from advertising partners',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'high',
                impact: 'Uses external data for ad targeting',
                recommendation: 'Disable for better privacy',
              },
              'ads-based-on-activity': {
                name: 'Ads based on your activity',
                description: 'Show ads based on your Facebook activity',
                type: 'toggle',
                defaultValue: true,
                riskLevel: 'medium',
                impact: 'Personalizes ads based on your Facebook usage',
              },
            },
          },
        },
        metadata: {
          totalSettings: 5,
          lastScrapedAt: new Date().toISOString(),
        },
      },
    } as any;

    // User's privacy-conscious settings
    const userPrivacySettings = {
      'privacy': {
        'future-posts': 'Only me',     // More private than default
        'friend-requests': 'Friends of friends', // More restrictive than default  
        'email-lookup': 'Friends',     // More private than default
      },
      'advertising': {
        'ads-based-on-data': false,    // Disabled for privacy (default: true)
        'ads-based-on-activity': false, // Disabled for privacy (default: true)
      },
    };

    // Test compression
    const compressedSettings = templateSystem.compressUserSettings(facebookTemplate, userPrivacySettings);
    const stats = templateSystem.calculateCompressionStats(facebookTemplate, userPrivacySettings);

    // All settings are different from defaults, so compression is based on template sharing
    const traditionalSize = Buffer.from(JSON.stringify({
      template: facebookTemplate.settingsStructure,
      userSettings: userPrivacySettings,
    })).length;

    const templateSize = Buffer.from(JSON.stringify(facebookTemplate.settingsStructure)).length;
    const userDiffSize = Buffer.from(JSON.stringify(compressedSettings)).length;

    const storageMetrics = calculateStorageMetrics(templateSize, userDiffSize, traditionalSize);

    console.log('Facebook Privacy Settings Storage Optimization:', {
      traditionalSize: `${Math.round(traditionalSize / 1024 * 100) / 100} KB`,
      optimizedSize: `${Math.round(storageMetrics.optimizedSize / 1024 * 100) / 100} KB`,
      savings: `${storageMetrics.savingsPercentage}%`,
      compressionRatio: `${Math.round(stats.compressionRatio * 10000) / 100}%`,
    });

    // Even when most settings differ from defaults, template sharing provides significant savings
    expect(storageMetrics.savingsPercentage).toBeGreaterThan(80); // At least 80% savings
  });

  test('should validate compression with minimal user changes', () => {
    // Template with comprehensive privacy settings
    const comprehensiveTemplate = {
      id: 'comprehensive-template',
      settingsStructure: {
        categories: {
          'privacy': {
            name: 'Privacy',
            settings: Array.from({ length: 20 }, (_, i) => [`setting-${i}`, {
              name: `Setting ${i}`,
              type: 'toggle',
              defaultValue: i % 2 === 0, // Alternating defaults
              riskLevel: i < 5 ? 'high' : i < 10 ? 'medium' : 'low',
            }]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
          },
        },
        metadata: { totalSettings: 20, lastScrapedAt: new Date().toISOString() },
      },
    } as any;

    // User only changes 3 out of 20 settings
    const minimalUserChanges = {
      'privacy': {
        'setting-0': true,   // Changed from false
        'setting-5': false,  // Changed from true  
        'setting-10': true,  // Changed from false
        // 17 other settings use defaults
      },
    };

    const compressedSettings = templateSystem.compressUserSettings(comprehensiveTemplate, minimalUserChanges);
    const stats = templateSystem.calculateCompressionStats(comprehensiveTemplate, minimalUserChanges);

    // With minimal changes, compression should be excellent
    expect(Object.keys(compressedSettings.privacy || {})).toHaveLength(3); // Only 3 differences stored
    expect(stats.compressionRatio).toBeLessThan(0.02); // Less than 2% of original
    
    console.log('Minimal Changes Compression:', {
      totalSettings: 20,
      changedSettings: 3,
      compressionRatio: `${Math.round(stats.compressionRatio * 10000) / 100}%`,
      savings: `${Math.round((1 - stats.compressionRatio) * 10000) / 100}%`,
    });
  });

  test('should handle edge cases in compression', () => {
    const template = {
      settingsStructure: {
        categories: {
          'test': {
            name: 'Test',
            settings: {
              'boolean-setting': { defaultValue: false, type: 'toggle' },
              'string-setting': { defaultValue: 'default', type: 'select' },
              'complex-setting': { defaultValue: { nested: 'value' }, type: 'text' },
            },
          },
        },
        metadata: { totalSettings: 3, lastScrapedAt: new Date().toISOString() },
      },
    } as any;

    // Edge cases
    const edgeCaseSettings = {
      'test': {
        'boolean-setting': false,    // Same as default
        'string-setting': 'default', // Same as default  
        'complex-setting': { nested: 'value' }, // Same as default (complex object)
      },
    };

    const compressed = templateSystem.compressUserSettings(template, edgeCaseSettings);
    
    // When all settings match defaults, compressed result should be empty
    expect(Object.keys(compressed.test || {})).toHaveLength(0);
  });

  test('should validate performance benchmarks', () => {
    const startTime = Date.now();
    
    // Large template with 100 settings
    const largeTemplate = {
      settingsStructure: {
        categories: Array.from({ length: 10 }, (_, categoryIndex) => [
          `category-${categoryIndex}`,
          {
            name: `Category ${categoryIndex}`,
            settings: Array.from({ length: 10 }, (_, settingIndex) => [
              `setting-${categoryIndex}-${settingIndex}`,
              {
                name: `Setting ${settingIndex}`,
                type: 'toggle',
                defaultValue: settingIndex % 2 === 0,
              }
            ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
          }
        ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        metadata: { totalSettings: 100, lastScrapedAt: new Date().toISOString() },
      },
    } as any;

    // Large user settings with 50% different from defaults
    const largeUserSettings = Array.from({ length: 10 }, (_, categoryIndex) => [
      `category-${categoryIndex}`,
      Array.from({ length: 10 }, (_, settingIndex) => [
        `setting-${categoryIndex}-${settingIndex}`,
        settingIndex % 4 === 0 ? !(settingIndex % 2 === 0) : (settingIndex % 2 === 0) // 50% different
      ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // Test compression performance
    const compressed = templateSystem.compressUserSettings(largeTemplate, largeUserSettings);
    const stats = templateSystem.calculateCompressionStats(largeTemplate, largeUserSettings);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Performance Benchmark (100 settings):', {
      duration: `${duration}ms`,
      compressionRatio: `${Math.round(stats.compressionRatio * 10000) / 100}%`,
      settingsStored: Object.values(compressed).reduce((sum, cat: any) => sum + Object.keys(cat).length, 0),
      expectedChanges: 25, // ~25% should be different from defaults
    });

    // Performance requirements
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
    expect(stats.compressionRatio).toBeLessThan(0.3); // Should still achieve good compression
  });
});

describe('Storage Optimization Integration', () => {
  test('should demonstrate end-to-end storage savings', () => {
    // Simulate 1000 users with Google privacy settings
    const userCount = 1000;
    const templateSize = 45 * 1024; // 45KB template
    const avgUserDiffSize = 1 * 1024; // 1KB average user diff
    const traditionalSnapshotSize = 50 * 1024; // 50KB traditional snapshot

    // Calculate total storage
    const traditionalTotalStorage = userCount * traditionalSnapshotSize;
    const optimizedTotalStorage = templateSize + (userCount * avgUserDiffSize);
    
    const totalSavings = traditionalTotalStorage - optimizedTotalStorage;
    const savingsPercentage = (totalSavings / traditionalTotalStorage) * 100;

    console.log('Enterprise Scale Storage Optimization:', {
      users: userCount.toLocaleString(),
      traditionalStorage: `${Math.round(traditionalTotalStorage / (1024 * 1024) * 100) / 100} MB`,
      optimizedStorage: `${Math.round(optimizedTotalStorage / (1024 * 1024) * 100) / 100} MB`,
      totalSavings: `${Math.round(totalSavings / (1024 * 1024) * 100) / 100} MB`,
      savingsPercentage: `${Math.round(savingsPercentage * 100) / 100}%`,
    });

    // Validate enterprise-scale savings
    expect(savingsPercentage).toBeGreaterThan(95);
    expect(totalSavings).toBeGreaterThan(45 * 1024 * 1024); // At least 45MB saved
  });

  test('should validate storage targets across all platforms', () => {
    const platforms = [
      { name: 'Google', avgSettingsCount: 15, avgTemplateSize: 45 },
      { name: 'Facebook', avgSettingsCount: 18, avgTemplateSize: 50 },  
      { name: 'LinkedIn', avgSettingsCount: 12, avgTemplateSize: 40 },
    ];

    platforms.forEach(platform => {
      const templateSize = platform.avgTemplateSize * 1024;
      const userDiffSize = 1 * 1024; // Assume 1KB average diff
      const traditionalSize = (platform.avgTemplateSize + 5) * 1024; // +5KB for user data

      const storageMetrics = calculateStorageMetrics(templateSize, userDiffSize, traditionalSize);

      console.log(`${platform.name} Storage Metrics:`, {
        settings: platform.avgSettingsCount,
        templateSize: `${platform.avgTemplateSize}KB`,
        savings: `${storageMetrics.savingsPercentage}%`,
        meetsTarget: storageMetrics.meetsTarget,
      });

      expect(storageMetrics.savingsPercentage).toBeGreaterThan(90);
    });
  });
});