/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Silence lockfile root detection warnings in monorepos or nested envs
  outputFileTracingRoot: __dirname,
  // No rewrites: client calls /api/* directly
};

module.exports = nextConfig;
