import { isFeatureEnabled } from '@privyloop/core';

// Only export enterprise features if running in cloud mode
export const billing = isFeatureEnabled('billing') ? require('./billing') : null;
export const multiTenant = isFeatureEnabled('multiTenant') ? require('./multi-tenant') : null;
export const analytics = isFeatureEnabled('advancedAnalytics') ? require('./analytics') : null;