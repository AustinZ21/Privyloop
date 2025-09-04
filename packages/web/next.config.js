/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@privyloop/core', '@privyloop/enterprise'],
  experimental: {
    esmExternals: 'loose',
  },
  env: {
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'self-hosted',
  },
}

module.exports = nextConfig;