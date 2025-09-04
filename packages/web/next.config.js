/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@privyloop/core', '@privyloop/enterprise'],
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  env: {
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'self-hosted',
  },
}

module.exports = nextConfig;