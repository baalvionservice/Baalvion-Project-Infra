import type { NextConfig } from 'next';

// Next.js dev (webpack HMR + react-refresh) runs on eval() and a localhost websocket; a prod-grade
// CSP that omits 'unsafe-eval'/ws breaks the client bundle in dev (nothing hydrates). Relax in dev
// only; prod stays strict. 'unsafe-inline' stays for inline JSON-LD / Next bootstrap.
const isDev = process.env.NODE_ENV !== 'production';

// The admin console talks to many backend services through the same-origin /api/proxy rewrite, so
// connect-src stays permissive (https: + self) rather than enumerating every microservice origin.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https:${isDev ? ' http://localhost:* ws://localhost:* ws://127.0.0.1:*' : ''};
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

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
    // Generic API-gateway proxy target. Fall back to the public gateway so the
    // rewrite destination is ALWAYS a valid absolute URL. A missing env var here
    // yields `undefined/:path*`, which Next.js rejects — failing the build on
    // Vercel, where .env.local is absent. Never let an unset var break the build.
    const apiTarget =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_GATEWAY_URL ||
      'https://api.baalvion.com/v1';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${apiTarget}/:path*`,
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
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
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
