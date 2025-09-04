/**
 * Type-safe privacy snapshots database operations
 * Template-based user privacy data with change detection
 */

import { eq, desc, and, count, gte, lte, isNotNull, or, avg } from 'drizzle-orm';
import type { Database } from '../connection';
import { 
  privacySnapshots, 
  type PrivacySnapshot, 
  type NewPrivacySnapshot, 
  type UpdatePrivacySnapshot,
  type UserPrivacySettings,
  type PrivacyChanges,
  insertPrivacySnapshotSchema,
  updatePrivacySnapshotSchema
} from '../schema/privacy-snapshots';

/**
 * Create a new privacy snapshot
 */
export const createPrivacySnapshot = async (db: Database, snapshotData: NewPrivacySnapshot): Promise<PrivacySnapshot> => {
  // Validate input
  const validatedData = insertPrivacySnapshotSchema.parse(snapshotData);
  
  try {
    const [newSnapshot] = await db.insert(privacySnapshots).values(validatedData).returning();
    return newSnapshot;
  } catch (error) {
    console.error('Error creating privacy snapshot:', error);
    throw new Error(`Failed to create privacy snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get privacy snapshot by ID
 */
export const getPrivacySnapshotById = async (db: Database, snapshotId: string): Promise<PrivacySnapshot | null> => {
  try {
    const [snapshot] = await db.select().from(privacySnapshots).where(eq(privacySnapshots.id, snapshotId)).limit(1);
    return snapshot || null;
  } catch (error) {
    console.error('Error getting privacy snapshot by ID:', error);
    throw new Error(`Failed to get privacy snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get latest privacy snapshot for user and platform
 */
export const getLatestUserPlatformSnapshot = async (
  db: Database, 
  userId: string, 
  platformId: string
): Promise<PrivacySnapshot | null> => {
  try {
    const [snapshot] = await db
      .select()
      .from(privacySnapshots)
      .where(and(
        eq(privacySnapshots.userId, userId),
        eq(privacySnapshots.platformId, platformId)
      ))
      .orderBy(desc(privacySnapshots.scannedAt))
      .limit(1);
    
    return snapshot || null;
  } catch (error) {
    console.error('Error getting latest user platform snapshot:', error);
    throw new Error(`Failed to get latest snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get privacy snapshots history for user and platform
 */
export const getUserPlatformSnapshotHistory = async (
  db: Database, 
  userId: string, 
  platformId: string,
  limit: number = 10
): Promise<PrivacySnapshot[]> => {
  try {
    const snapshots = await db
      .select()
      .from(privacySnapshots)
      .where(and(
        eq(privacySnapshots.userId, userId),
        eq(privacySnapshots.platformId, platformId)
      ))
      .orderBy(desc(privacySnapshots.scannedAt))
      .limit(limit);
    
    return snapshots;
  } catch (error) {
    console.error('Error getting user platform snapshot history:', error);
    throw new Error(`Failed to get snapshot history: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get all user's privacy snapshots
 */
export const getAllUserSnapshots = async (db: Database, userId: string): Promise<PrivacySnapshot[]> => {
  try {
    const snapshots = await db
      .select()
      .from(privacySnapshots)
      .where(eq(privacySnapshots.userId, userId))
      .orderBy(desc(privacySnapshots.scannedAt));
    
    return snapshots;
  } catch (error) {
    console.error('Error getting all user snapshots:', error);
    throw new Error(`Failed to get user snapshots: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get snapshots with changes
 */
export const getSnapshotsWithChanges = async (
  db: Database, 
  userId?: string, 
  platformId?: string,
  limit: number = 50
): Promise<PrivacySnapshot[]> => {
  try {
    let query = db
      .select()
      .from(privacySnapshots)
      .where(eq(privacySnapshots.hasChanges, true));
    
    if (userId) {
      query = query.where(and(eq(privacySnapshots.hasChanges, true), eq(privacySnapshots.userId, userId)));
    }
    
    if (platformId) {
      query = query.where(and(
        eq(privacySnapshots.hasChanges, true),
        eq(privacySnapshots.platformId, platformId),
        userId ? eq(privacySnapshots.userId, userId) : undefined
      ).filter(Boolean));
    }
    
    const snapshots = await query
      .orderBy(desc(privacySnapshots.scannedAt))
      .limit(limit);
    
    return snapshots;
  } catch (error) {
    console.error('Error getting snapshots with changes:', error);
    throw new Error(`Failed to get snapshots with changes: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update privacy snapshot
 */
export const updatePrivacySnapshot = async (
  db: Database, 
  snapshotId: string, 
  updateData: UpdatePrivacySnapshot
): Promise<PrivacySnapshot> => {
  // Validate input
  const validatedData = updatePrivacySnapshotSchema.parse(updateData);
  
  try {
    const [updatedSnapshot] = await db
      .update(privacySnapshots)
      .set(validatedData)
      .where(eq(privacySnapshots.id, snapshotId))
      .returning();
    
    return updatedSnapshot;
  } catch (error) {
    console.error('Error updating privacy snapshot:', error);
    throw new Error(`Failed to update privacy snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Compare two privacy snapshots to detect changes
 */
export const compareSnapshots = (
  previousSnapshot: PrivacySnapshot | null,
  currentSnapshot: UserPrivacySettings
): PrivacyChanges => {
  if (!previousSnapshot) {
    return {};
  }
  
  const changes: PrivacyChanges = {};
  const previousSettings = previousSnapshot.userSettings;
  
  // Compare each category and setting
  for (const [categoryId, categorySettings] of Object.entries(currentSnapshot)) {
    const previousCategorySettings = previousSettings[categoryId] || {};
    
    for (const [settingId, currentValue] of Object.entries(categorySettings)) {
      const previousValue = previousCategorySettings[settingId];
      
      if (JSON.stringify(previousValue) !== JSON.stringify(currentValue)) {
        if (!changes[categoryId]) {
          changes[categoryId] = {};
        }
        
        changes[categoryId][settingId] = {
          oldValue: previousValue,
          newValue: currentValue,
          changeType: 'unknown', // Will be determined by analysis
          detectedAt: new Date().toISOString(),
        };
      }
    }
  }
  
  return changes;
};

/**
 * Calculate risk score based on user settings and template
 */
export const calculateRiskScore = (
  userSettings: UserPrivacySettings,
  templateAnalysis?: any // From privacy template AI analysis
): number => {
  // Simple risk calculation - can be enhanced with AI analysis
  let riskScore = 0;
  let totalSettings = 0;
  
  for (const categorySettings of Object.values(userSettings)) {
    for (const settingValue of Object.values(categorySettings)) {
      totalSettings++;
      
      // Example risk calculation (would be more sophisticated in practice)
      if (typeof settingValue === 'boolean' && settingValue === true) {
        riskScore += 10; // Assume "enabled" increases risk
      }
    }
  }
  
  return totalSettings > 0 ? Math.min(Math.round((riskScore / totalSettings) * 10), 100) : 0;
};

/**
 * Get privacy statistics for user
 */
export const getUserPrivacyStats = async (db: Database, userId: string) => {
  try {
    const [totalSnapshots] = await db
      .select({ count: count() })
      .from(privacySnapshots)
      .where(eq(privacySnapshots.userId, userId));
    
    const [snapshotsWithChanges] = await db
      .select({ count: count() })
      .from(privacySnapshots)
      .where(and(
        eq(privacySnapshots.userId, userId),
        eq(privacySnapshots.hasChanges, true)
      ));
    
    const [averageRiskScore] = await db
      .select({ avg: avg(privacySnapshots.riskScore) })
      .from(privacySnapshots)
      .where(and(
        eq(privacySnapshots.userId, userId),
        isNotNull(privacySnapshots.riskScore)
      ));
    
    return {
      totalSnapshots: totalSnapshots.count,
      snapshotsWithChanges: snapshotsWithChanges.count,
      averageRiskScore: Math.round(averageRiskScore.avg || 0),
    };
  } catch (error) {
    console.error('Error getting user privacy stats:', error);
    throw new Error(`Failed to get privacy stats: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Clean up expired snapshots based on retention policy
 */
export const cleanupExpiredSnapshots = async (db: Database): Promise<number> => {
  try {
    const now = new Date();
    
    const deletedSnapshots = await db
      .delete(privacySnapshots)
      .where(and(
        isNotNull(privacySnapshots.expiresAt),
        lte(privacySnapshots.expiresAt, now)
      ))
      .returning({ id: privacySnapshots.id });
    
    console.log(`🗑️ Cleaned up ${deletedSnapshots.length} expired privacy snapshots`);
    return deletedSnapshots.length;
  } catch (error) {
    console.error('Error cleaning up expired snapshots:', error);
    throw new Error(`Failed to cleanup expired snapshots: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get snapshots for a specific scan
 */
export const getSnapshotsByScanId = async (db: Database, scanId: string): Promise<PrivacySnapshot[]> => {
  try {
    const snapshots = await db
      .select()
      .from(privacySnapshots)
      .where(eq(privacySnapshots.scanId, scanId))
      .orderBy(desc(privacySnapshots.scannedAt));
    
    return snapshots;
  } catch (error) {
    console.error('Error getting snapshots by scan ID:', error);
    throw new Error(`Failed to get snapshots by scan ID: ${error instanceof Error ? error.message : String(error)}`);
  }
};