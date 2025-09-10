/**
 * Feature flags (client-safe) — simplified
 *
 * Minimal flags to keep OSS stable and showcase Enterprise:
 * - NEXT_PUBLIC_FEATURE_LIVE_CARDS: when true, overlay all live card metrics
 *   (Last scan, Privacy score, Risk badge) with safe fallbacks.
 * - NEXT_PUBLIC_DEPLOYMENT_MODE: 'open-source' | 'enterprise' — gates
 *   enterprise-only modules on the Analytics page.
 */

export const flags = {
  // Global switch for all live card overlays (Last scan, Score, Risk badge).
  liveCards: process.env.NEXT_PUBLIC_FEATURE_LIVE_CARDS === 'true',

  // Deployment mode gating for Analytics extras (change tracking, trends, admin refresh).
  deploymentMode: process.env.NEXT_PUBLIC_DEPLOYMENT_MODE || 'open-source',
  isEnterprise: process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'enterprise',
};
