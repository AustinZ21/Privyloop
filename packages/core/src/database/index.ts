/**
 * Database module exports
 * Complete database architecture for PrivyLoop with template-based optimization
 */

// Core database connection and configuration
export * from './connection';
export * from './config';

// Database schema
export * from './schema';

// Database operations
export * from './operations';

// Migration system
export * from './migrations';
export { migration001 } from './migrations/001-initial-schema';

// Initialize database
export const initializeDatabase = async () => {
  const { getDb, testConnection } = await import('./connection');
  const { runMigrations } = await import('./migrations');
  const { migration001 } = await import('./migrations/001-initial-schema');
  
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    // Run migrations
    const db = getDb();
    await runMigrations(db, [migration001]);
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};