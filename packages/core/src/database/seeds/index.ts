/**
 * Database seeding system
 * Populates database with sample data for development and testing
 */

import { count } from 'drizzle-orm';
import type { Database } from '../connection';
import { platforms, privacyTemplates } from '../schema';
import { platformSeeds } from './platforms';
import { privacyTemplateSeeds } from './privacy-templates';

/**
 * Seed all development data
 */
export const seedDatabase = async (db: Database) => {
  console.log('🌱 Starting database seeding...');
  
  try {
    // 1. Seed platforms
    console.log('📦 Seeding platforms...');
    const insertedPlatforms = await db.insert(platforms).values(platformSeeds).returning();
    console.log(`✅ Inserted ${insertedPlatforms.length} platforms`);
    
    // Create platform ID mapping for templates
    const platformMap = insertedPlatforms.reduce((acc, platform) => {
      acc[platform.slug] = platform.id;
      return acc;
    }, {} as Record<string, string>);
    
    // 2. Seed privacy templates
    console.log('📋 Seeding privacy templates...');
    const templateSeeds = privacyTemplateSeeds({
      google: platformMap.google,
      facebook: platformMap.facebook,
    });
    
    const insertedTemplates = await db.insert(privacyTemplates).values(templateSeeds).returning();
    console.log(`✅ Inserted ${insertedTemplates.length} privacy templates`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    return {
      platforms: insertedPlatforms,
      templates: insertedTemplates,
    };
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw new Error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Clear all seeded data (for testing)
 */
export const clearSeedData = async (db: Database) => {
  console.log('🗑️ Clearing seed data...');
  
  try {
    // Clear in reverse dependency order
    await db.delete(privacyTemplates);
    await db.delete(platforms);
    
    console.log('✅ Seed data cleared');
  } catch (error) {
    console.error('❌ Failed to clear seed data:', error);
    throw error;
  }
};

/**
 * Check if database has been seeded
 */
export const isDatabaseSeeded = async (db: Database): Promise<boolean> => {
  try {
    const [platformCount] = await db
      .select({ count: count() })
      .from(platforms);
    
    return platformCount.count > 0;
  } catch (error) {
    console.error('Error checking seed status:', error);
    return false;
  }
};

/**
 * Seed database if not already seeded
 */
export const seedIfNeeded = async (db: Database) => {
  const isSeeded = await isDatabaseSeeded(db);
  
  if (!isSeeded) {
    console.log('📊 Database not seeded, running initial seed...');
    await seedDatabase(db);
  } else {
    console.log('✅ Database already seeded, skipping...');
  }
};