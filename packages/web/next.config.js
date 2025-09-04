/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@privyloop/core', '@privyloop/enterprise'],
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  env: {
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'self-hosted',
  },
  // Use custom dist directory to avoid potential lock on .next
  distDir: 'build'
}

module.exports = nextConfig;