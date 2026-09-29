import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Every product page is statically rendered at build time, so the whole catalogue is
  // crawlable HTML rather than something a bot has to run JavaScript to see.
  output: 'standalone',
};

export default nextConfig;
