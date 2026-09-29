import type { NextConfig } from 'next';

/**
 * Static export: this is a documentation site with no server runtime,
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
