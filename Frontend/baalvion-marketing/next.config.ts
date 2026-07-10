import type { NextConfig } from 'next';

/**
 * Static export: this app is a pure marketing site with no server runtime,
 * no auth, and no data fetching. `images.unoptimized` is required because a
 * static export has no Next image server.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
