/**
 * Database configuration for PrivyLoop
 * Supports both self-hosted PostgreSQL and cloud-based Supabase deployments
 */

import { z } from 'zod';

const configSchema = z.object({
  databaseUrl: z.string().min(1, 'Database URL is required'),
  deploymentType: z.enum(['self-hosted', 'cloud']).default('self-hosted'),
  maxConnections: z.number().default(10),
  idleTimeoutMs: z.number().default(30000),
  ssl: z.boolean().default(false),
});

export type DatabaseConfig = z.infer<typeof configSchema>;

/**
 * Database configuration with environment variable support
 */
export const config: DatabaseConfig = configSchema.parse({
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/privyloop',
  deploymentType: (process.env.DEPLOYMENT_TYPE as 'self-hosted' | 'cloud') || 'self-hosted',
  maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idleTimeoutMs: process.env.DB_IDLE_TIMEOUT_MS ? parseInt(process.env.DB_IDLE_TIMEOUT_MS) : 30000,
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true',
});

/**
 * Database connection options for different deployment types
 */
export const getConnectionOptions = () => {
  const baseOptions = {
    max: config.maxConnections,
    idle_timeout: config.idleTimeoutMs,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  };

  if (config.deploymentType === 'cloud') {
    return {
      ...baseOptions,
      // Cloud-specific optimizations
      application_name: 'privyloop-cloud',
      statement_timeout: 30000,
      query_timeout: 30000,
    };
  }

  return {
    ...baseOptions,
    // Self-hosted optimizations
    application_name: 'privyloop-self-hosted',
    statement_timeout: 60000,
    query_timeout: 60000,
  };
};