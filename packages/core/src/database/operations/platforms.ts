/**
 * Type-safe platform database operations
 * CRUD operations for platforms table
 */

import { eq, desc, asc, count, and, like, or, ne } from 'drizzle-orm';
import type { Database } from '../connection';
import { 
  platforms, 
  type Platform, 
  type NewPlatform, 
  type UpdatePlatform,
  type SupportedPlatform,
  insertPlatformSchema,
  updatePlatformSchema,
  SUPPORTED_PLATFORMS
} from '../schema/platforms';

/**
 * Create a new platform
 */
export const createPlatform = async (db: Database, platformData: NewPlatform): Promise<Platform> => {
  // Validate input
  const validatedData = insertPlatformSchema.parse(platformData);
  
  try {
    const [newPlatform] = await db.insert(platforms).values(validatedData).returning();
    return newPlatform;
  } catch (error) {
    console.error('Error creating platform:', error);
    throw new Error(`Failed to create platform: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get platform by ID
 */
export const getPlatformById = async (db: Database, platformId: string): Promise<Platform | null> => {
  try {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, platformId)).limit(1);
    return platform || null;
  } catch (error) {
    console.error('Error getting platform by ID:', error);
    throw new Error(`Failed to get platform: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get platform by slug
 */
export const getPlatformBySlug = async (db: Database, slug: string): Promise<Platform | null> => {
  try {
    const [platform] = await db.select().from(platforms).where(eq(platforms.slug, slug)).limit(1);
    return platform || null;
  } catch (error) {
    console.error('Error getting platform by slug:', error);
    throw new Error(`Failed to get platform: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get all active platforms
 */
export const getActivePlatforms = async (db: Database): Promise<Platform[]> => {
  try {
    const activePlatforms = await db
      .select()
      .from(platforms)
      .where(and(eq(platforms.isActive, true), eq(platforms.isSupported, true)))
      .orderBy(asc(platforms.name));
    
    return activePlatforms;
  } catch (error) {
    console.error('Error getting active platforms:', error);
    throw new Error(`Failed to get active platforms: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get all platforms (admin view)
 */
export const getAllPlatforms = async (db: Database): Promise<Platform[]> => {
  try {
    const allPlatforms = await db
      .select()
      .from(platforms)
      .orderBy(asc(platforms.name));
    
    return allPlatforms;
  } catch (error) {
    console.error('Error getting all platforms:', error);
    throw new Error(`Failed to get all platforms: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update platform
 */
export const updatePlatform = async (db: Database, platformId: string, updateData: UpdatePlatform): Promise<Platform> => {
  // Validate input
  const validatedData = updatePlatformSchema.parse(updateData);
  const updateDataWithTimestamp = { 
    ...validatedData, 
    updatedAt: new Date(),
  };
  
  try {
    const [updatedPlatform] = await db
      .update(platforms)
      .set(updateDataWithTimestamp)
      .where(eq(platforms.id, platformId))
      .returning();
    
    return updatedPlatform;
  } catch (error) {
    console.error('Error updating platform:', error);
    throw new Error(`Failed to update platform: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Toggle platform active status
 */
export const togglePlatformStatus = async (db: Database, platformId: string, isActive: boolean): Promise<Platform> => {
  try {
    return await updatePlatform(db, platformId, {
      isActive,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error toggling platform status:', error);
    throw new Error(`Failed to toggle platform status: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update platform configuration
 */
export const updatePlatformConfig = async (
  db: Database, 
  platformId: string, 
  configData: {
    scrapingConfig?: Platform['scrapingConfig'];
    privacyPageUrls?: Platform['privacyPageUrls'];
    configVersion?: string;
    lastUpdatedBy?: string;
  }
): Promise<Platform> => {
  try {
    return await updatePlatform(db, platformId, {
      ...configData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating platform config:', error);
    throw new Error(`Failed to update platform config: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Search platforms by name or domain
 */
export const searchPlatforms = async (db: Database, searchTerm: string): Promise<Platform[]> => {
  try {
    const searchResults = await db
      .select()
      .from(platforms)
      .where(or(
        like(platforms.name, `%${searchTerm}%`),
        like(platforms.domain, `%${searchTerm}%`),
        like(platforms.slug, `%${searchTerm}%`)
      ))
      .orderBy(asc(platforms.name))
      .limit(20);
    
    return searchResults;
  } catch (error) {
    console.error('Error searching platforms:', error);
    throw new Error(`Failed to search platforms: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get platforms requiring authentication
 */
export const getPlatformsRequiringAuth = async (db: Database): Promise<Platform[]> => {
  try {
    const authPlatforms = await db
      .select()
      .from(platforms)
      .where(and(
        eq(platforms.requiresAuth, true),
        eq(platforms.isActive, true),
        eq(platforms.isSupported, true)
      ))
      .orderBy(asc(platforms.name));
    
    return authPlatforms;
  } catch (error) {
    console.error('Error getting platforms requiring auth:', error);
    throw new Error(`Failed to get auth platforms: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get platform statistics
 */
export const getPlatformStats = async (db: Database) => {
  try {
    const [totalPlatforms] = await db.select({ count: count() }).from(platforms);
    
    const [activePlatforms] = await db
      .select({ count: count() })
      .from(platforms)
      .where(eq(platforms.isActive, true));
    
    const [supportedPlatforms] = await db
      .select({ count: count() })
      .from(platforms)
      .where(and(
        eq(platforms.isActive, true),
        eq(platforms.isSupported, true)
      ));
    
    const [requiresAuthCount] = await db
      .select({ count: count() })
      .from(platforms)
      .where(and(
        eq(platforms.requiresAuth, true),
        eq(platforms.isActive, true)
      ));
    
    return {
      total: totalPlatforms.count,
      active: activePlatforms.count,
      supported: supportedPlatforms.count,
      requiresAuth: requiresAuthCount.count,
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    throw new Error(`Failed to get platform stats: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Check if platform slug is available
 */
export const isPlatformSlugAvailable = async (db: Database, slug: string, excludeId?: string): Promise<boolean> => {
  try {
    const [existingPlatform] = await db
      .select()
      .from(platforms)
      .where(and(
        eq(platforms.slug, slug),
        excludeId ? ne(platforms.id, excludeId) : undefined
      ))
      .limit(1);
    return !existingPlatform;
  } catch (error) {
    console.error('Error checking platform slug availability:', error);
    throw new Error(`Failed to check slug availability: ${error instanceof Error ? error.message : String(error)}`);
  }
};