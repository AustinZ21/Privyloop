#!/usr/bin/env node
/**
 * Database setup script
 * Initialize database, run migrations, and seed with sample data
 */

import { getDb, closeConnection, testConnection, runMigrations, getMigrationStatus } from '../src/database/connection';
import { migration001 } from '../src/database/migrations/001-initial-schema';
import { seedDatabase, seedIfNeeded, isDatabaseSeeded } from '../src/database/seeds';

const setupDatabase = async () => {
  console.log('🚀 PrivyLoop Database Setup Starting...\n');
  
  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL.');
      process.exit(1);
    }
    console.log('✅ Database connection successful\n');
    
    // 2. Get database instance
    const db = getDb();
    
    // 3. Check migration status
    console.log('2️⃣ Checking migration status...');
    const migrationStatus = await getMigrationStatus(db, [migration001]);
    
    console.log('Migration Status:');
    migrationStatus.forEach(migration => {
      const status = migration.executed ? '✅ Executed' : '⏳ Pending';
      console.log(`  ${migration.id} - ${migration.name}: ${status}`);
    });
    console.log();
    
    // 4. Run migrations
    console.log('3️⃣ Running database migrations...');
    await runMigrations(db, [migration001]);
    console.log('✅ Migrations completed\n');
    
    // 5. Check if database is seeded
    console.log('4️⃣ Checking seed status...');
    const isSeeded = await isDatabaseSeeded(db);
    
    if (isSeeded) {
      console.log('✅ Database already seeded');
      
      // Ask if user wants to re-seed
      const shouldReseed = process.argv.includes('--force-seed');
      if (shouldReseed) {
        console.log('🔄 Force re-seeding requested...');
        await seedDatabase(db);
      } else {
        console.log('💡 Use --force-seed flag to re-seed database');
      }
    } else {
      console.log('📦 Seeding database with sample data...');
      await seedDatabase(db);
    }
    console.log();
    
    // 6. Final status
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Database is ready for development');
    
    // Show connection info
    const { getConnectionInfo } = await import('../src/database/connection');
    const connectionInfo = getConnectionInfo();
    console.log('\n📋 Connection Info:');
    console.log(`  Deployment Type: ${connectionInfo.deploymentType}`);
    console.log(`  Max Connections: ${connectionInfo.maxConnections}`);
    console.log(`  SSL Enabled: ${connectionInfo.ssl}`);
    console.log(`  Connected: ${connectionInfo.isConnected}`);
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🗄️ PrivyLoop Database Setup

Usage: npm run db:setup [options]

Options:
  --force-seed    Force re-seed database even if already seeded
  --help, -h      Show this help message

Environment Variables:
  DATABASE_URL           PostgreSQL connection string (required)
  DEPLOYMENT_TYPE        'self-hosted' or 'cloud' (default: 'self-hosted')
  DB_MAX_CONNECTIONS     Maximum database connections (default: 10)
  DB_SSL                 Enable SSL connections (default: false for dev)

Examples:
  npm run db:setup                    # Setup database with default options
  npm run db:setup --force-seed       # Setup and force re-seed
  
  DATABASE_URL="postgresql://user:pass@localhost:5432/privyloop" npm run db:setup
`);
  process.exit(0);
}

// Run setup
setupDatabase();