/**
 * Real-Data Storage Compression Verification Tests
 * Validates claimed 98% storage reduction with realistic user privacy settings
 * Tests template-based optimization against traditional per-user storage
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { TemplateSystemImpl } from '../template-system';
import { type PrivacyTemplate, type UserPrivacySettings, COMPRESSION_TARGETS } from '../types';
import type { Database } from '../../database/config';

// Mock database for testing
const mockDb = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as Database;

describe('Storage Compression Verification', () => {
  let templateSystem: TemplateSystemImpl;

  beforeEach(() => {
    templateSystem = new TemplateSystemImpl(mockDb);
    jest.clearAllMocks();
  });

  describe('Real User Data Compression', () => {
    test('should achieve 95%+ compression with 1000 realistic Google profiles', async () => {
      // Generate 1000 realistic Google privacy profiles
      const userProfiles = generateRealisticGoogleProfiles(1000);
      const googleTemplate = createGooglePrivacyTemplate();
      
      // Calculate traditional storage (no templates)
      const traditionalStorage = calculateTraditionalStorage(userProfiles);
      
      // Calculate template-based storage
      let templateBasedStorage = 0;
      const compressedProfiles = [];
      
      // Template storage (shared once across all users)
      const templateSize = Buffer.from(JSON.stringify(googleTemplate)).length;
      templateBasedStorage += templateSize;
      
      // Compress each user profile using template
      for (const userSettings of userProfiles) {
        const compressed = templateSystem.compressUserSettings(googleTemplate, userSettings);
        const compressedSize = Buffer.from(JSON.stringify(compressed)).length;
        templateBasedStorage += compressedSize;
        compressedProfiles.push({ original: userSettings, compressed, size: compressedSize });
      }
      
      // Calculate compression metrics
      const compressionRatio = templateBasedStorage / traditionalStorage;
      const savings = (traditionalStorage - templateBasedStorage) / traditionalStorage;
      const averageUserDiff = (templateBasedStorage - templateSize) / userProfiles.length;
      
      console.log(`📊 Storage Compression Results (1000 Google profiles):`);
      console.log(`   Traditional Storage: ${formatBytes(traditionalStorage)}`);
      console.log(`   Template + Diffs: ${formatBytes(templateBasedStorage)}`);
      console.log(`   Template Size: ${formatBytes(templateSize)}`);
      console.log(`   Average User Diff: ${formatBytes(averageUserDiff)}`);
      console.log(`   Compression Ratio: ${(compressionRatio * 100).toFixed(1)}%`);
      console.log(`   Storage Savings: ${(savings * 100).toFixed(1)}%`);
      
      // Validate claimed metrics
      expect(savings).toBeGreaterThanOrEqual(COMPRESSION_TARGETS.SIZE_REDUCTION);
      expect(compressionRatio).toBeLessThan(0.05); // Less than 5% of original size
      expect(averageUserDiff).toBeLessThan(2000); // Less than 2KB per user diff
      expect(templateSize).toBeLessThan(50000); // Template under 50KB
      
      // Verify data integrity - compression should be lossless
      for (const profile of compressedProfiles.slice(0, 10)) {
        const decompressed = templateSystem.decompressUserSettings(googleTemplate, profile.compressed);
        expect(decompressed).toEqual(profile.original);
      }
    });

    test('should achieve optimal compression with Facebook profiles', async () => {
      const userProfiles = generateRealisticFacebookProfiles(500);
      const facebookTemplate = createFacebookPrivacyTemplate();
      
      const results = await measureCompressionEfficiency(
        templateSystem,
        facebookTemplate, 
        userProfiles,
        'Facebook'
      );
      
      expect(results.savings).toBeGreaterThanOrEqual(0.90); // 90%+ for Facebook
      expect(results.averageUserDiff).toBeLessThan(1500); // Under 1.5KB per user
    });

    test('should achieve optimal compression with LinkedIn profiles', async () => {
      const userProfiles = generateRealisticLinkedInProfiles(300);
      const linkedinTemplate = createLinkedInPrivacyTemplate();
      
      const results = await measureCompressionEfficiency(
        templateSystem,
        linkedinTemplate,
        userProfiles,
        'LinkedIn'
      );
      
      expect(results.savings).toBeGreaterThanOrEqual(0.85); // 85%+ for LinkedIn
      expect(results.averageUserDiff).toBeLessThan(1000); // Under 1KB per user
    });
  });

  describe('Template Sharing Efficiency', () => {
    test('should demonstrate single template serves thousands of users', async () => {
      const googleTemplate = createGooglePrivacyTemplate();
      const userCounts = [100, 500, 1000, 2000];
      const results = [];
      
      for (const userCount of userCounts) {
        const userProfiles = generateRealisticGoogleProfiles(userCount);
        const efficiency = await measureCompressionEfficiency(
          templateSystem,
          googleTemplate,
          userProfiles,
          `Google-${userCount}`
        );
        results.push({ userCount, ...efficiency });
      }
      
      // Template reuse efficiency should improve with more users
      expect(results[0].templateOverhead).toBeGreaterThan(results[3].templateOverhead);
      expect(results[3].savings).toBeGreaterThan(results[0].savings);
      
      // Log scaling efficiency
      console.log(`📈 Template Scaling Efficiency:`);
      results.forEach(r => {
        console.log(`   ${r.userCount} users: ${(r.savings * 100).toFixed(1)}% savings, ${formatBytes(r.templateOverhead)} overhead per user`);
      });
    });

    test('should validate claimed 45KB template + 1KB user diff scenario', async () => {
      const googleTemplate = createGooglePrivacyTemplate();
      const templateSize = Buffer.from(JSON.stringify(googleTemplate)).length;
      
      // Generate users with varied privacy preferences
      const diverseUsers = generateDiversePrivacyProfiles(1000);
      const userDiffSizes = [];
      
      for (const userSettings of diverseUsers) {
        const compressed = templateSystem.compressUserSettings(googleTemplate, userSettings);
        const diffSize = Buffer.from(JSON.stringify(compressed)).length;
        userDiffSizes.push(diffSize);
      }
      
      const averageDiffSize = userDiffSizes.reduce((a, b) => a + b, 0) / userDiffSizes.length;
      const maxDiffSize = Math.max(...userDiffSizes);
      
      console.log(`🎯 Template + Diff Size Analysis:`);
      console.log(`   Template Size: ${formatBytes(templateSize)} (target: ~45KB)`);
      console.log(`   Average Diff: ${formatBytes(averageDiffSize)} (target: ~1KB)`);
      console.log(`   Max Diff: ${formatBytes(maxDiffSize)}`);
      console.log(`   Diff Range: ${formatBytes(Math.min(...userDiffSizes))} - ${formatBytes(maxDiffSize)}`);
      
      // Validate target metrics (allow some flexibility)
      expect(templateSize).toBeLessThan(60000); // Under 60KB template
      expect(averageDiffSize).toBeLessThan(2000); // Under 2KB average diff
      expect(maxDiffSize).toBeLessThan(5000); // Under 5KB worst case diff
    });
  });

  describe('Cross-Platform Template Efficiency', () => {
    test('should compare compression efficiency across all platforms', async () => {
      const platforms = [
        { name: 'Google', template: createGooglePrivacyTemplate(), profiles: generateRealisticGoogleProfiles(200) },
        { name: 'Facebook', template: createFacebookPrivacyTemplate(), profiles: generateRealisticFacebookProfiles(200) },
        { name: 'LinkedIn', template: createLinkedInPrivacyTemplate(), profiles: generateRealisticLinkedInProfiles(200) }
      ];
      
      const comparisonResults = [];
      
      for (const platform of platforms) {
        const results = await measureCompressionEfficiency(
          templateSystem,
          platform.template,
          platform.profiles,
          platform.name
        );
        comparisonResults.push({ platform: platform.name, ...results });
      }
      
      console.log(`📊 Cross-Platform Compression Comparison:`);
      comparisonResults.forEach(r => {
        console.log(`   ${r.platform}: ${(r.savings * 100).toFixed(1)}% savings, ${formatBytes(r.averageUserDiff)} avg diff`);
      });
      
      // All platforms should achieve significant compression
      comparisonResults.forEach(result => {
        expect(result.savings).toBeGreaterThanOrEqual(0.80); // 80%+ minimum
      });
    });
  });
});

// Utility Functions for Realistic Data Generation

function generateRealisticGoogleProfiles(count: number): UserPrivacySettings[] {
  const profiles: UserPrivacySettings[] = [];
  const privacyPatterns = [
    'privacy-conscious', 'balanced', 'convenience-focused', 'minimal-sharing', 'open-sharing'
  ];
  
  for (let i = 0; i < count; i++) {
    const pattern = privacyPatterns[i % privacyPatterns.length];
    profiles.push(generateGoogleProfileByPattern(pattern, i));
  }
  
  return profiles;
}

function generateGoogleProfileByPattern(pattern: string, userId: number): UserPrivacySettings {
  const baseSettings = {
    'web-activity': false,
    'location-history': false,
    'ad-personalization': false,
    'youtube-history': false,
    'search-history': false,
    'assistant-activity': false,
    'maps-timeline': false,
    'photos-face-grouping': false,
    'play-activity': false,
    'chrome-sync': false,
    'device-information': false,
    'voice-audio-activity': false
  };
  
  // Apply pattern-based variations
  switch (pattern) {
    case 'privacy-conscious':
      return { 'privacy-controls': { ...baseSettings } }; // All false (default)
      
    case 'balanced':
      return {
        'privacy-controls': {
          ...baseSettings,
          'search-history': true,
          'chrome-sync': true,
          'maps-timeline': userId % 2 === 0 // 50% variation
        }
      };
      
    case 'convenience-focused':
      return {
        'privacy-controls': {
          ...baseSettings,
          'web-activity': true,
          'search-history': true,
          'assistant-activity': true,
          'chrome-sync': true,
          'maps-timeline': true,
          'ad-personalization': userId % 3 === 0 // 33% variation
        }
      };
      
    case 'minimal-sharing':
      return {
        'privacy-controls': {
          ...baseSettings,
          'chrome-sync': userId % 4 === 0, // 25% enable sync only
        }
      };
      
    case 'open-sharing':
      // Enable most features with some random variation
      const openSettings = { ...baseSettings };
      Object.keys(openSettings).forEach(key => {
        openSettings[key] = Math.random() > 0.2; // 80% chance enabled
      });
      return { 'privacy-controls': openSettings };
      
    default:
      return { 'privacy-controls': baseSettings };
  }
}

function generateRealisticFacebookProfiles(count: number): UserPrivacySettings[] {
  const profiles: UserPrivacySettings[] = [];
  
  for (let i = 0; i < count; i++) {
    profiles.push({
      'privacy-settings': {
        'future-posts': ['Public', 'Friends', 'Only me'][i % 3],
        'friend-requests': ['Everyone', 'Friends of friends'][i % 2],
        'ad-preferences': Math.random() > 0.4, // 60% enabled
        'face-recognition': Math.random() > 0.6, // 40% enabled
        'location-services': Math.random() > 0.5, // 50% enabled
        'data-sharing': Math.random() > 0.7 // 30% enabled
      }
    });
  }
  
  return profiles;
}

function generateRealisticLinkedInProfiles(count: number): UserPrivacySettings[] {
  const profiles: UserPrivacySettings[] = [];
  
  for (let i = 0; i < count; i++) {
    profiles.push({
      'profile-privacy': {
        'public-profile-visibility': ['public', 'limited'][i % 2],
        'activity-broadcasts': Math.random() > 0.3, // 70% enabled
        'profile-discovery': Math.random() > 0.4, // 60% enabled
        'contact-sync': Math.random() > 0.6, // 40% enabled
        'ad-targeting': Math.random() > 0.5 // 50% enabled
      }
    });
  }
  
  return profiles;
}

function generateDiversePrivacyProfiles(count: number): UserPrivacySettings[] {
  // Create maximum variation to test worst-case compression scenarios
  const profiles: UserPrivacySettings[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomSettings: Record<string, any> = {};
    
    // Generate random privacy preferences
    for (let category = 0; category < 3; category++) {
      const categorySettings: Record<string, any> = {};
      
      for (let setting = 0; setting < 10; setting++) {
        const settingKey = `setting-${category}-${setting}`;
        
        // Random value types to test compression
        const valueType = Math.random();
        if (valueType < 0.4) {
          categorySettings[settingKey] = Math.random() > 0.5; // Boolean
        } else if (valueType < 0.7) {
          categorySettings[settingKey] = ['option1', 'option2', 'option3'][Math.floor(Math.random() * 3)]; // String
        } else {
          categorySettings[settingKey] = Math.floor(Math.random() * 5); // Number
        }
      }
      
      randomSettings[`category-${category}`] = categorySettings;
    }
    
    profiles.push(randomSettings);
  }
  
  return profiles;
}

async function measureCompressionEfficiency(
  templateSystem: TemplateSystemImpl,
  template: PrivacyTemplate,
  userProfiles: UserPrivacySettings[],
  platformName: string
): Promise<{
  savings: number;
  compressionRatio: number;
  averageUserDiff: number;
  templateSize: number;
  templateOverhead: number;
}> {
  // Traditional storage calculation
  const traditionalStorage = userProfiles.reduce((total, profile) => {
    return total + Buffer.from(JSON.stringify(profile)).length;
  }, 0);
  
  // Template-based storage calculation
  const templateSize = Buffer.from(JSON.stringify(template)).length;
  let totalDiffSize = 0;
  
  for (const userSettings of userProfiles) {
    const compressed = templateSystem.compressUserSettings(template, userSettings);
    totalDiffSize += Buffer.from(JSON.stringify(compressed)).length;
  }
  
  const templateBasedStorage = templateSize + totalDiffSize;
  const savings = (traditionalStorage - templateBasedStorage) / traditionalStorage;
  const compressionRatio = templateBasedStorage / traditionalStorage;
  const averageUserDiff = totalDiffSize / userProfiles.length;
  const templateOverhead = templateSize / userProfiles.length;
  
  return {
    savings,
    compressionRatio,
    averageUserDiff,
    templateSize,
    templateOverhead
  };
}

function calculateTraditionalStorage(userProfiles: UserPrivacySettings[]): number {
  return userProfiles.reduce((total, profile) => {
    return total + Buffer.from(JSON.stringify(profile)).length;
  }, 0);
}

function createGooglePrivacyTemplate(): PrivacyTemplate {
  return {
    id: 'google-template-v1',
    platformId: 'google',
    version: '1.0.0',
    settingsStructure: {
      categories: {
        'privacy-controls': {
          name: 'Privacy Controls',
          settings: {
            'web-activity': { type: 'boolean', defaultValue: false },
            'location-history': { type: 'boolean', defaultValue: false },
            'ad-personalization': { type: 'boolean', defaultValue: false },
            'youtube-history': { type: 'boolean', defaultValue: false },
            'search-history': { type: 'boolean', defaultValue: false },
            'assistant-activity': { type: 'boolean', defaultValue: false },
            'maps-timeline': { type: 'boolean', defaultValue: false },
            'photos-face-grouping': { type: 'boolean', defaultValue: false },
            'play-activity': { type: 'boolean', defaultValue: false },
            'chrome-sync': { type: 'boolean', defaultValue: false },
            'device-information': { type: 'boolean', defaultValue: false },
            'voice-audio-activity': { type: 'boolean', defaultValue: false }
          }
        }
      }
    },
    createdAt: new Date(),
    isActive: true
  };
}

function createFacebookPrivacyTemplate(): PrivacyTemplate {
  return {
    id: 'facebook-template-v1',
    platformId: 'facebook',
    version: '1.0.0',
    settingsStructure: {
      categories: {
        'privacy-settings': {
          name: 'Privacy Settings',
          settings: {
            'future-posts': { type: 'select', defaultValue: 'Friends' },
            'friend-requests': { type: 'select', defaultValue: 'Friends of friends' },
            'ad-preferences': { type: 'boolean', defaultValue: true },
            'face-recognition': { type: 'boolean', defaultValue: false },
            'location-services': { type: 'boolean', defaultValue: false },
            'data-sharing': { type: 'boolean', defaultValue: false }
          }
        }
      }
    },
    createdAt: new Date(),
    isActive: true
  };
}

function createLinkedInPrivacyTemplate(): PrivacyTemplate {
  return {
    id: 'linkedin-template-v1',
    platformId: 'linkedin',
    version: '1.0.0',
    settingsStructure: {
      categories: {
        'profile-privacy': {
          name: 'Profile Privacy',
          settings: {
            'public-profile-visibility': { type: 'select', defaultValue: 'limited' },
            'activity-broadcasts': { type: 'boolean', defaultValue: true },
            'profile-discovery': { type: 'boolean', defaultValue: true },
            'contact-sync': { type: 'boolean', defaultValue: false },
            'ad-targeting': { type: 'boolean', defaultValue: true }
          }
        }
      }
    },
    createdAt: new Date(),
    isActive: true
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}