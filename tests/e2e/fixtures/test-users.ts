/**
 * Test user fixtures for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin';
}

export const TEST_USERS = {
  // Valid test user for successful authentication tests
  validUser: {
    email: 'test.user@privyloop-test.com',
    password: 'ValidTestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const
  },

  // Admin test user for admin functionality tests
  adminUser: {
    email: 'admin.test@privyloop-test.com', 
    password: 'AdminTestPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const
  },

  // Invalid user for negative testing
  invalidUser: {
    email: 'invalid.user@privyloop-test.com',
    password: 'WrongPassword123!',
    firstName: 'Invalid',
    lastName: 'User'
  }
} as const;

export const INVALID_CREDENTIALS = {
  emptyEmail: {
    email: '',
    password: 'SomePassword123!'
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'SomePassword123!'
  },
  emptyPassword: {
    email: 'test@example.com',
    password: ''
  },
  weakPassword: {
    email: 'test@example.com',
    password: '123'
  },
  nonExistentUser: {
    email: 'nonexistent@privyloop-test.com',
    password: 'SomePassword123!'
  }
} as const;

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
} as const;