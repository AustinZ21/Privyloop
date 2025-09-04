/**
 * Database migration system
 * Handles version control and rollback capabilities
 */

import { sql, type Database } from '../connection';

export interface Migration {
  id: string;
  name: string;
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
  createdAt: Date;
}

/**
 * Create migrations table if it doesn't exist
 */
export const createMigrationsTable = async (db: Database) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
};

/**
 * Get list of executed migrations
 */
export const getExecutedMigrations = async (db: Database): Promise<string[]> => {
  try {
    const result = await db.execute(sql`
      SELECT id FROM migrations ORDER BY executed_at ASC;
    `);
    return result.rows.map(row => row.id as string);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    return [];
  }
};

/**
 * Mark migration as executed
 */
export const markMigrationExecuted = async (db: Database, migration: Migration) => {
  await db.execute(sql`
    INSERT INTO migrations (id, name, executed_at) 
    VALUES (${migration.id}, ${migration.name}, NOW());
  `);
};

/**
 * Remove migration from executed list
 */
export const removeMigrationRecord = async (db: Database, migrationId: string) => {
  await db.execute(sql`
    DELETE FROM migrations WHERE id = ${migrationId};
  `);
};

/**
 * Run pending migrations
 */
export const runMigrations = async (db: Database, migrations: Migration[]) => {
  // Ensure migrations table exists
  await createMigrationsTable(db);
  
  // Get executed migrations
  const executedMigrations = await getExecutedMigrations(db);
  
  // Filter pending migrations
  const pendingMigrations = migrations.filter(
    migration => !executedMigrations.includes(migration.id)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('✅ No pending migrations');
    return;
  }
  
  console.log(`🔄 Running ${pendingMigrations.length} pending migration(s)...`);
  
  for (const migration of pendingMigrations) {
    try {
      console.log(`⬆️  Executing migration: ${migration.name}`);
      await migration.up(db);
      await markMigrationExecuted(db, migration);
      console.log(`✅ Migration completed: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`, error);
      throw new Error(`Migration failed: ${migration.name} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('✅ All migrations completed successfully');
};

/**
 * Rollback last migration
 */
export const rollbackLastMigration = async (db: Database, migrations: Migration[]) => {
  // Get executed migrations
  const executedMigrations = await getExecutedMigrations(db);
  
  if (executedMigrations.length === 0) {
    console.log('✅ No migrations to rollback');
    return;
  }
  
  // Get last executed migration
  const lastMigrationId = executedMigrations[executedMigrations.length - 1];
  const migration = migrations.find(m => m.id === lastMigrationId);
  
  if (!migration) {
    throw new Error(`Migration not found: ${lastMigrationId}`);
  }
  
  try {
    console.log(`⬇️  Rolling back migration: ${migration.name}`);
    await migration.down(db);
    await removeMigrationRecord(db, migration.id);
    console.log(`✅ Rollback completed: ${migration.name}`);
  } catch (error) {
    console.error(`❌ Rollback failed: ${migration.name}`, error);
    throw new Error(`Rollback failed: ${migration.name} - ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Check migration status
 */
export const getMigrationStatus = async (db: Database, migrations: Migration[]) => {
  await createMigrationsTable(db);
  const executedMigrations = await getExecutedMigrations(db);
  
  return migrations.map(migration => ({
    id: migration.id,
    name: migration.name,
    executed: executedMigrations.includes(migration.id),
    createdAt: migration.createdAt,
  }));
};