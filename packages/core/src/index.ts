// Core exports
export * from './features';
export * from './utils';

// Type exports (explicit to avoid conflicts)
export type { 
  DeploymentMode, 
  FeatureFlags, 
  PlatformConfig, 
  User, 
  Platform, 
  PrivacySettings 
} from './types';

// Validation exports (schemas and validation-specific types)
export {
  userSchema,
  createUserSchema,
  platformSchema,
  createPlatformSchema,
  privacySettingsSchema,
  updatePrivacySettingsSchema,
  deploymentModeSchema,
  featureFlagsSchema,
  environmentSchema,
  type CreateUser,
  type CreatePlatform,
  type UpdatePrivacySettings,
  type Environment
} from './validation';

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