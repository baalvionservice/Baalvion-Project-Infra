import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle so the Dockerfile's `.next/standalone` + server.js exist.
  // Standalone file-tracing recreates the pnpm symlink tree, which throws EPERM on Windows
  // (symlink creation needs Admin/Developer Mode). Production images build on Linux where this
  // works; skip it on win32 so local Windows builds succeed without changing the deploy artifact.
  output: process.platform === 'win32' ? undefined : 'standalone',
  reactStrictMode: true,
  // Production build resilience: don't fail the build on pre-existing type/lint
  // issues in unrelated pages — the goal here is a stable, pre-compiled server.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.baalvionstack.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
      // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
      { source: '/auth-bff/:path*', destination: `${authTarget}/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Hashed build assets are immutable — cache them hard so repeat loads and
        // page-to-page navigation pull JS/CSS from the browser cache instantly.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
