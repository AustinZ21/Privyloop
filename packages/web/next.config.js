/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Serve a tiny favicon via API to avoid 404 noise in dev
      { source: '/favicon.ico', destination: '/api/favicon' },
    ];
  },
};

module.exports = nextConfig;

