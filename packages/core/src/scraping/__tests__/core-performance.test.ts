/**
 * Core Performance Validation Test
 * Tests template system and core operations performance without platform scraper dependencies
 * Validates: API processing <150ms, Template operations <100ms
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { TemplateSystemImpl } from '../template-system';
import type { Database } from '../../database/config';

// Performance timing utility
class PerformanceTimer {
  private startTime: number = 0;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  stop(): number {
    const endTime = performance.now();
    return endTime - this.startTime;
  }
}

// Mock database for testing
const mockDb = {
  insert: jest.fn(),
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      })
    })
  }),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as Database;

describe('Core Performance Tests', () => {
  let templateSystem: TemplateSystemImpl;
  let timer: PerformanceTimer;

  beforeEach(() => {
    templateSystem = new TemplateSystemImpl(mockDb);
    timer = new PerformanceTimer();
    jest.clearAllMocks();
  });

  describe('Template System Performance (<150ms API target)', () => {
    test('should compress user settings under 50ms', async () => {
      const template = createMockTemplate();
      const userSettings = createMockUserSettings();
      
      timer.start();
      const compressed = templateSystem.compressUserSettings(template, userSettings);
      const compressionTime = timer.stop();
      
      console.log(`⚡ Template Compression: ${compressionTime.toFixed(3)}ms`);
      
      expect(compressionTime).toBeLessThan(50); // Well under 150ms API target
      expect(compressed).toBeDefined();
      expect(Object.keys(compressed).length).toBeGreaterThan(0);
    });

    test('should decompress user settings under 30ms', async () => {
      const template = createMockTemplate();
      const userSettings = createMockUserSettings();
      const compressed = templateSystem.compressUserSettings(template, userSettings);
      
      timer.start();
      const decompressed = templateSystem.decompressUserSettings(template, compressed);
      const decompressionTime = timer.stop();
      
      console.log(`⚡ Template Decompression: ${decompressionTime.toFixed(3)}ms`);
      
      expect(decompressionTime).toBeLessThan(30); // Should be very fast
      expect(decompressed).toEqual(userSettings);
    });

    test('should calculate compression stats under 20ms', async () => {
      const template = createMockTemplate();
      const userSettings = createMockUserSettings();
      
      timer.start();
      const stats = templateSystem.calculateCompressionStats(template, userSettings);
      const calculationTime = timer.stop();
      
      console.log(`⚡ Compression Stats: ${calculationTime.toFixed(3)}ms`);
      console.log(`   Compression Ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);
      console.log(`   Storage Savings: ${(stats.savings * 100).toFixed(1)}%`);
      
      expect(calculationTime).toBeLessThan(20); // Very fast calculation
      expect(stats.savings).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeLessThan(1);
    });

    test('should handle large user settings under 100ms', async () => {
      const template = createLargeTemplate();
      const largeUserSettings = createLargeUserSettings();
      
      timer.start();
      const compressed = templateSystem.compressUserSettings(template, largeUserSettings);
      const compressionTime = timer.stop();
      
      console.log(`⚡ Large Data Compression: ${compressionTime.toFixed(3)}ms`);
      console.log(`   Categories: ${Object.keys(largeUserSettings).length}`);
      console.log(`   Total Settings: ${countTotalSettings(largeUserSettings)}`);
      
      expect(compressionTime).toBeLessThan(100); // Under API target even for large data
      expect(compressed).toBeDefined();
      
      // Verify it's still compressed efficiently
      const stats = templateSystem.calculateCompressionStats(template, largeUserSettings);
      expect(stats.savings).toBeGreaterThan(0.8); // 80%+ compression even for large data
    });

    test('should maintain performance under concurrent operations', async () => {
      const template = createMockTemplate();
      const concurrentOperations = 50;
      const operations = [];
      
      console.log(`⚡ Concurrent Operations Test: ${concurrentOperations} operations`);
      
      const overallStart = performance.now();
      
      for (let i = 0; i < concurrentOperations; i++) {
        operations.push(async () => {
          const userSettings = createVariableUserSettings(i);
          const startTime = performance.now();
          
          // Full compression-decompression cycle
          const compressed = templateSystem.compressUserSettings(template, userSettings);
          const decompressed = templateSystem.decompressUserSettings(template, compressed);
          
          const duration = performance.now() - startTime;
          return { id: i, duration, compressed, decompressed };
        });
      }
      
      const results = await Promise.all(operations.map(op => op()));
      const overallTime = performance.now() - overallStart;
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const maxDuration = Math.max(...results.map(r => r.duration));
      const minDuration = Math.min(...results.map(r => r.duration));
      
      console.log(`   Overall Time: ${overallTime.toFixed(2)}ms`);
      console.log(`   Average Operation: ${avgDuration.toFixed(3)}ms`);
      console.log(`   Min Operation: ${minDuration.toFixed(3)}ms`);
      console.log(`   Max Operation: ${maxDuration.toFixed(3)}ms`);
      console.log(`   Operations/sec: ${((concurrentOperations / overallTime) * 1000).toFixed(0)}`);
      
      // Performance requirements
      expect(avgDuration).toBeLessThan(50); // Average well under API target
      expect(maxDuration).toBeLessThan(150); // Even slowest under API target
      
      // All operations should succeed
      expect(results.every(r => r.compressed && r.decompressed)).toBe(true);
    });
  });

  describe('Scaling Performance Analysis', () => {
    test('should demonstrate performance scaling with user count', async () => {
      const template = createMockTemplate();
      const userCounts = [10, 50, 100, 500, 1000];
      
      console.log(`📊 Performance Scaling Analysis:`);
      
      for (const userCount of userCounts) {
        timer.start();
        
        // Simulate processing multiple users
        for (let i = 0; i < userCount; i++) {
          const userSettings = createVariableUserSettings(i);
          templateSystem.compressUserSettings(template, userSettings);
        }
        
        const totalTime = timer.stop();
        const avgTimePerUser = totalTime / userCount;
        
        console.log(`   ${userCount} users: ${totalTime.toFixed(2)}ms total, ${avgTimePerUser.toFixed(3)}ms per user`);
        
        // Performance should scale linearly (avg time per user should be consistent)
        expect(avgTimePerUser).toBeLessThan(5); // <5ms per user even at scale
      }
    });

    test('should validate memory efficiency under load', async () => {
      const template = createMockTemplate();
      const iterations = 1000;
      
      console.log(`🧠 Memory Efficiency Test: ${iterations} iterations`);
      
      const initialMemory = process.memoryUsage();
      timer.start();
      
      for (let i = 0; i < iterations; i++) {
        const userSettings = createVariableUserSettings(i);
        const compressed = templateSystem.compressUserSettings(template, userSettings);
        
        // Simulate releasing references (garbage collection)
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const processingTime = timer.stop();
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const avgTimePerOperation = processingTime / iterations;
      
      console.log(`   Processing Time: ${processingTime.toFixed(2)}ms`);
      console.log(`   Avg per Operation: ${avgTimePerOperation.toFixed(3)}ms`);
      console.log(`   Memory Increase: ${formatBytes(memoryIncrease)}`);
      console.log(`   Operations/sec: ${((iterations / processingTime) * 1000).toFixed(0)}`);
      
      // Performance and memory requirements
      expect(avgTimePerOperation).toBeLessThan(5); // <5ms per operation
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // <50MB memory increase
    });
  });
});

// Utility functions for test data
function createMockTemplate() {
  return {
    id: 'test-template-v1',
    platformId: 'test-platform',
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
            'assistant-activity': { type: 'boolean', defaultValue: false }
          }
        },
        'sharing-settings': {
          name: 'Sharing Settings',
          settings: {
            'public-profile': { type: 'select', defaultValue: 'limited' },
            'contact-discovery': { type: 'boolean', defaultValue: true },
            'activity-status': { type: 'select', defaultValue: 'friends' }
          }
        }
      }
    },
    createdAt: new Date(),
    isActive: true
  };
}

function createMockUserSettings() {
  return {
    'privacy-controls': {
      'web-activity': true,   // Different from default (false)
      'location-history': false, // Same as default
      'ad-personalization': true, // Different from default
      'youtube-history': false, // Same as default
      'search-history': true, // Different from default
      'assistant-activity': false // Same as default
    },
    'sharing-settings': {
      'public-profile': 'public', // Different from default ('limited')
      'contact-discovery': true, // Same as default
      'activity-status': 'nobody' // Different from default ('friends')
    }
  };
}

function createLargeTemplate() {
  const categories: any = {};
  
  for (let cat = 0; cat < 10; cat++) {
    const settings: any = {};
    for (let setting = 0; setting < 20; setting++) {
      settings[`setting-${cat}-${setting}`] = { 
        type: 'boolean', 
        defaultValue: setting % 2 === 0 
      };
    }
    categories[`category-${cat}`] = {
      name: `Category ${cat}`,
      settings
    };
  }
  
  return {
    id: 'large-template-v1',
    platformId: 'test-platform',
    version: '1.0.0',
    settingsStructure: { categories },
    createdAt: new Date(),
    isActive: true
  };
}

function createLargeUserSettings() {
  const settings: any = {};
  
  for (let cat = 0; cat < 10; cat++) {
    const categorySettings: any = {};
    for (let setting = 0; setting < 20; setting++) {
      // Create variation from defaults
      categorySettings[`setting-${cat}-${setting}`] = Math.random() > 0.5;
    }
    settings[`category-${cat}`] = categorySettings;
  }
  
  return settings;
}

function createVariableUserSettings(variation: number) {
  return {
    'privacy-controls': {
      'web-activity': variation % 2 === 0,
      'location-history': variation % 3 === 0,
      'ad-personalization': variation % 2 === 1,
      'youtube-history': variation % 4 === 0,
      'search-history': variation % 5 === 0,
      'assistant-activity': variation % 6 === 0
    },
    'sharing-settings': {
      'public-profile': ['public', 'limited', 'private'][variation % 3],
      'contact-discovery': variation % 2 === 1,
      'activity-status': ['friends', 'nobody', 'everyone'][variation % 3]
    }
  };
}

function countTotalSettings(userSettings: any): number {
  let count = 0;
  for (const category of Object.values(userSettings)) {
    if (typeof category === 'object' && category !== null) {
      count += Object.keys(category).length;
    }
  }
  return count;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}