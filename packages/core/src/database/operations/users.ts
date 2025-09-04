/**
 * Type-safe user database operations
 * CRUD operations for users table with subscription management
 */

import { eq, and, desc, count, isNull, or } from 'drizzle-orm';
import type { Database } from '../connection';
import { 
  users, 
  type User, 
  type NewUser, 
  type UpdateUser, 
  type SubscriptionTier,
  insertUserSchema,
  updateUserSchema,
  SUBSCRIPTION_LIMITS
} from '../schema/users';
import { auditLogs, createAuditLog, AUDIT_EVENT_TYPES, AUDIT_CATEGORIES } from '../schema/audit-logs';

/**
 * Create a new user
 */
export const createUser = async (db: Database, userData: NewUser): Promise<User> => {
  // Validate input
  const validatedData = insertUserSchema.parse(userData);
  
  try {
    const [newUser] = await db.insert(users).values(validatedData).returning();
    
    // Create audit log
    await db.insert(auditLogs).values(createAuditLog({
      eventType: AUDIT_EVENT_TYPES.USER_REGISTERED,
      eventCategory: AUDIT_CATEGORIES.USER,
      action: 'create_user',
      userId: newUser.id,
      resource: 'user',
      resourceId: newUser.id,
      eventData: {
        after: { email: newUser.email, subscriptionTier: newUser.subscriptionTier },
      },
    }));
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (db: Database, userId: string): Promise<User | null> => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (db: Database, email: string): Promise<User | null> => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update user
 */
export const updateUser = async (db: Database, userId: string, updateData: UpdateUser): Promise<User> => {
  // Validate input
  const validatedData = updateUserSchema.parse(updateData);
  const updateDataWithTimestamp = { 
    ...validatedData, 
    updatedAt: new Date(),
  };
  
  try {
    // Get current user for audit log
    const currentUser = await getUserById(db, userId);
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateDataWithTimestamp)
      .where(eq(users.id, userId))
      .returning();
    
    // Create audit log
    await db.insert(auditLogs).values(createAuditLog({
      eventType: AUDIT_EVENT_TYPES.USER_UPDATED,
      eventCategory: AUDIT_CATEGORIES.USER,
      action: 'update_user',
      userId: userId,
      resource: 'user',
      resourceId: userId,
      eventData: {
        before: currentUser,
        after: updatedUser,
        changes: Object.keys(updateData).reduce((acc, key) => {
          const k = key as keyof UpdateUser;
          if (updateData[k] !== undefined && updateData[k] !== currentUser[k]) {
            acc[key] = { old: currentUser[k], new: updateData[k] };
          }
          return acc;
        }, {} as Record<string, { old: any; new: any }>),
      },
    }));
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update user subscription
 */
export const updateUserSubscription = async (
  db: Database, 
  userId: string, 
  subscriptionData: {
    subscriptionTier: SubscriptionTier;
    subscriptionStatus?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
): Promise<User> => {
  try {
    return await updateUser(db, userId, {
      ...subscriptionData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (db: Database, userId: string): Promise<User> => {
  try {
    return await updateUser(db, userId, {
      lastLoginAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Check if user can add more privacy cards
 */
export const canAddPrivacyCard = async (db: Database, userId: string): Promise<boolean> => {
  try {
    const user = await getUserById(db, userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier as SubscriptionTier];
    return user.privacyCardsUsed < limits.privacyCards;
  } catch (error) {
    console.error('Error checking privacy card limit:', error);
    throw new Error(`Failed to check privacy card limit: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Increment privacy cards used
 */
export const incrementPrivacyCardsUsed = async (db: Database, userId: string): Promise<User> => {
  try {
    const user = await getUserById(db, userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return await updateUser(db, userId, {
      privacyCardsUsed: user.privacyCardsUsed + 1,
    });
  } catch (error) {
    console.error('Error incrementing privacy cards used:', error);
    throw new Error(`Failed to increment privacy cards: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Soft delete user (GDPR compliance)
 */
export const requestUserDeletion = async (db: Database, userId: string): Promise<User> => {
  try {
    return await updateUser(db, userId, {
      deletionRequestedAt: new Date(),
    });
  } catch (error) {
    console.error('Error requesting user deletion:', error);
    throw new Error(`Failed to request user deletion: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get users for deletion (cleanup job)
 */
export const getUsersPendingDeletion = async (db: Database): Promise<User[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usersToDelete = await db
      .select()
      .from(users)
      .where(and(
        isNull(users.deletionRequestedAt),
        eq(users.deletionRequestedAt, thirtyDaysAgo)
      ))
      .orderBy(desc(users.deletionRequestedAt));
    
    return usersToDelete;
  } catch (error) {
    console.error('Error getting users pending deletion:', error);
    throw new Error(`Failed to get users pending deletion: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (db: Database) => {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    
    const [activeUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(isNull(users.deletionRequestedAt));
    
    const [verifiedUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.emailVerified, true),
        isNull(users.deletionRequestedAt)
      ));
    
    // Get subscription breakdown
    const subscriptionStats = await db
      .select({
        subscriptionTier: users.subscriptionTier,
        count: count(),
      })
      .from(users)
      .where(isNull(users.deletionRequestedAt))
      .groupBy(users.subscriptionTier);
    
    return {
      total: totalUsers.count,
      active: activeUsers.count,
      verified: verifiedUsers.count,
      subscriptions: subscriptionStats,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : String(error)}`);
  }
};