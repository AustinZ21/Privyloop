/**
 * Database testing utilities
 * Test helpers for database operations and fixtures
 */

import type { Database } from '../connection';
import { 
  users, 
  platforms, 
  privacyTemplates, 
  privacySnapshots, 
  userPlatformConnections,
  auditLogs,
  type NewUser,
  type NewPlatform,
  type NewPrivacyTemplate,
  type NewPrivacySnapshot,
} from '../schema';

/**
 * Create test user
 */
export const createTestUser = async (db: Database, overrides?: Partial<NewUser>) => {
  const testUser: NewUser = {
    id: `user_${Math.random().toString(36).substring(2)}`, // Generate unique ID
    email: 'test@example.com',
    emailVerified: true,
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    privacyCardsUsed: 0,
    preferences: {
      notifications: { email: true, changeAlerts: true, weeklyDigest: false },
      scanning: { frequency: 'weekly', autoScan: true },
      privacy: { dataRetention: '1y', shareAnalytics: false },
    },
    ...overrides,
  };
  
  const [user] = await db.insert(users).values(testUser).returning();
  return user;
};

/**
 * Create test platform
 */
export const createTestPlatform = async (db: Database, overrides?: Partial<NewPlatform>) => {
  const testPlatform: NewPlatform = {
    name: 'Test Platform',
    slug: 'test-platform',
    domain: 'test.com',
    description: 'Test platform for development',
    privacyPageUrls: {
      main: 'https://test.com/privacy',
    },
    scrapingConfig: {
      selectors: {
        'test-setting': {
          selector: '[data-testid="test-toggle"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
      },
    },
    manifestPermissions: ['https://*.test.com/*'],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
    ...overrides,
  };
  
  const [platform] = await db.insert(platforms).values(testPlatform).returning();
  return platform;
};

/**
 * Create test privacy template
 */
export const createTestPrivacyTemplate = async (
  db: Database, 
  platformId: string,
  overrides?: Partial<NewPrivacyTemplate>
) => {
  const testTemplate: NewPrivacyTemplate = {
    platformId,
    version: 'v2024-09-04-test',
    templateHash: 'test123456789abcdef',
    name: 'Test Privacy Template',
    description: 'Test template for development',
    settingsStructure: {
      categories: {
        'test-category': {
          name: 'Test Category',
          description: 'Test privacy settings category',
          settings: {
            'test-setting': {
              name: 'Test Setting',
              description: 'A test privacy setting',
              type: 'toggle',
              defaultValue: false,
              riskLevel: 'low',
              impact: 'Minimal impact for testing',
              recommendation: 'Safe to enable for testing',
            },
          },
        },
      },
      metadata: {
        totalSettings: 1,
        lastScrapedAt: new Date().toISOString(),
        platformVersion: 'v1.0.0-test',
      },
    },
    aiAnalysis: {
      overallRiskScore: 25,
      keyRecommendations: ['Test recommendation'],
      categoryScores: { 'test-category': 25 },
      riskFactors: ['Test risk factor'],
      privacyImpact: 'low',
      generatedAt: new Date().toISOString(),
      modelUsed: 'test-model',
    },
    isActive: true,
    createdBy: 'test-system',
    ...overrides,
  };
  
  const [template] = await db.insert(privacyTemplates).values(testTemplate).returning();
  return template;
};

/**
 * Create test privacy snapshot
 */
export const createTestPrivacySnapshot = async (
  db: Database,
  userId: string,
  platformId: string,
  templateId: string,
  overrides?: Partial<NewPrivacySnapshot>
) => {
  const testSnapshot: NewPrivacySnapshot = {
    userId,
    platformId,
    templateId,
    userSettings: {
      'test-category': {
        'test-setting': false,
      },
    },
    scanMethod: 'extension',
    scanStatus: 'completed',
    hasChanges: false,
    isUserInitiated: false,
    completionRate: 1.0,
    confidenceScore: 1.0,
    riskScore: 25,
    riskFactors: [],
    recommendations: { high: [], medium: [], low: [] },
    retentionPolicy: '1y',
    ...overrides,
  };
  
  const [snapshot] = await db.insert(privacySnapshots).values(testSnapshot).returning();
  return snapshot;
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (db: Database) => {
  // Delete in reverse dependency order
  await db.delete(auditLogs);
  await db.delete(privacySnapshots);
  await db.delete(userPlatformConnections);
  await db.delete(privacyTemplates);
  await db.delete(platforms);
  await db.delete(users);
};

/**
 * Create complete test scenario
 */
export const createTestScenario = async (db: Database) => {
  // Create test user
  const testUser = await createTestUser(db, {
    email: 'scenario@example.com',
  });
  
  // Create test platform
  const testPlatform = await createTestPlatform(db, {
    name: 'Scenario Platform',
    slug: 'scenario-platform',
  });
  
  // Create test template
  const testTemplate = await createTestPrivacyTemplate(db, testPlatform.id, {
    name: 'Scenario Privacy Template',
  });
  
  // Create user platform connection
  const [connection] = await db.insert(userPlatformConnections).values({
    userId: testUser.id,
    platformId: testPlatform.id,
    connectionName: 'Test Connection',
    isActive: true,
    isAuthorized: true,
    scanEnabled: true,
    scanFrequency: 'weekly',
    lastScanStatus: 'never',
    consecutiveFailures: 0,
    maxConsecutiveFailures: 5,
    platformSettings: {},
    preferences: {
      notifications: { changeAlerts: true, scanResults: false, failures: true },
      scanning: { includeInBulkScans: true, priority: 'medium' },
      privacy: { shareWithPlatform: false, includeInAnalytics: false },
    },
  }).returning();
  
  // Create test snapshot
  const testSnapshot = await createTestPrivacySnapshot(
    db,
    testUser.id,
    testPlatform.id,
    testTemplate.id
  );
  
  return {
    user: testUser,
    platform: testPlatform,
    template: testTemplate,
    connection,
    snapshot: testSnapshot,
  };
};

/**
 * Database test helpers
 */
export const dbTestHelpers = {
  createTestUser,
  createTestPlatform,
  createTestPrivacyTemplate,
  createTestPrivacySnapshot,
  createTestScenario,
  cleanupTestData,
};

export default dbTestHelpers;