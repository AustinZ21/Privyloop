/**
 * Database connection management
 * Supports both self-hosted PostgreSQL and cloud Supabase deployments
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { config, getConnectionOptions } from './config';
import { schema, type DatabaseSchema } from './schema';

// Persist connection/log flags across HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var __PRIVY_DB__: ReturnType<typeof drizzle<DatabaseSchema>> | null | undefined;
  // eslint-disable-next-line no-var
  var __PRIVY_DB_LOGGED__: boolean | undefined;
}

// Global connection instance
let dbConnection: ReturnType<typeof drizzle<DatabaseSchema>> | null = (globalThis as any).__PRIVY_DB__ ?? null;
let client: ReturnType<typeof postgres> | null = null;

/**
 * Create database connection with proper configuration
 */
export const createConnection = () => {
  try {
    const connectionOptions = getConnectionOptions();
    
    // Create postgres client
    client = postgres(config.databaseUrl, connectionOptions);
    
    // Create Drizzle instance with schema
    const db = drizzle(client, { schema });
    
    console.log(`✅ Database connected (${config.deploymentType} mode)`);
    return db;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get or create database connection (singleton pattern)
 */
export const getDb = () => {
  if (!dbConnection) {
    dbConnection = createConnection();
  }
  return dbConnection;
};

/**
 * Close database connection gracefully
 */
export const closeConnection = async () => {
  try {
    if (client) {
      await client.end();
      client = null;
      dbConnection = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const db = getDb();
    
    // Simple query to test connection
    const result = await db.execute(sql`SELECT NOW() as timestamp, version() as version`);
    
    console.log('✅ Database connection test successful:', {
      timestamp: result[0]?.timestamp,
      version: result[0]?.version?.toString().substring(0, 50) + '...',
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

/**
 * Get database connection info
 */
export const getConnectionInfo = () => {
  return {
    deploymentType: config.deploymentType,
    maxConnections: config.maxConnections,
    ssl: config.ssl,
    isConnected: !!dbConnection,
  };
};

/**
 * Execute raw SQL query (for migrations and admin tasks)
 */
export const executeRawQuery = async (query: string, params?: any[]) => {
  try {
    if (!client) {
      throw new Error('Database client not initialized');
    }
    
    const result = await client.unsafe(query, params);
    return result;
  } catch (error) {
    console.error('❌ Raw query execution failed:', error);
    throw error;
  }
};

// Export sql template literal for raw queries
export { sql } from 'drizzle-orm';

// Type exports
export type Database = ReturnType<typeof getDb>;
export type DatabaseClient = typeof client;

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connection...');
  await closeConnection();
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connection...');
  await closeConnection();
});
