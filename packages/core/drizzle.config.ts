import type { Config } from 'drizzle-kit';
import { config } from './src/database/config';

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.databaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;