/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@privyloop/core', '@privyloop/enterprise'],
  },
  env: {
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'self-hosted',
  },
}

module.exports = nextConfig;