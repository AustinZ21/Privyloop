#!/usr/bin/env node
/**
 * Database seed runner
 * - Seeds platforms and privacy templates for development
 * - Idempotent by default: seeds only when empty
 * - Use --force to clear then reseed
 */

import { getDb, closeConnection } from '../src/database/connection';
import { seedDatabase, seedIfNeeded, clearSeedData, isDatabaseSeeded } from '../src/database/seeds';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`\nPrivyLoop DB Seed\n\nUsage: pnpm -F @privyloop/core db:seed [--force]\n\nOptions:\n  --force    Clear existing seed data and reseed\n`);
    process.exit(0);
  }

  const db = getDb();
  try {
    if (force) {
      console.log('⚠️  Force re-seeding requested: clearing then seeding...');
      await clearSeedData(db);
      await seedDatabase(db);
    } else {
      const seeded = await isDatabaseSeeded(db);
      if (seeded) {
        console.log('✅ Database already seeded — skipping. Use --force to reseed.');
      } else {
        await seedIfNeeded(db);
      }
    }
    console.log('✅ Seed complete');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();

