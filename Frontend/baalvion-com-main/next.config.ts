import type { NextConfig } from 'next';

/**
 * Static export for Cloudflare (Workers Static Assets / Pages).
 *
 * `output: 'export'` emits a fully static site into `out/`. Next.js `headers()`
 * does NOT run on a static host, so the security headers (CSP, HSTS, etc.) are
 * served by Cloudflare via `public/_headers` — keep the two in sync if either
 * changes. Image optimization is disabled because there is no Next image server
 * in a static export.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
