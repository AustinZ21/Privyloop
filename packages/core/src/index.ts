// Core exports
export * from './types';
export * from './features';
export * from './utils';
export * from './validation';

// Database exports (avoiding conflicts)
export { 
  getDb, 
  closeConnection, 
  testConnection, 
  initializeDatabase,
  type Database 
} from './database';

// Auth exports
export { auth, type Session } from './auth';