/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@privyloop/core', '@privyloop/enterprise'],
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  env: {
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'self-hosted',
    // Do not expose auth secrets here; read them at runtime on the server (process.env.*).
    // If the client needs a non-secret (e.g., OAuth client ID), use NEXT_PUBLIC_* vars
    // and reference them directly in code; mapping them here is unnecessary.
  },
  // Use custom dist directory to avoid potential lock on .next
  distDir: 'build'
}

module.exports = nextConfig;