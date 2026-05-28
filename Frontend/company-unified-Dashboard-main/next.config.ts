import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos",
      "font-src 'self' data:",
      "connect-src 'self' https://api.baalvion.com wss://api.baalvion.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Server-side BFF base — defaulting here makes process.env.DASHBOARD_API_URL always
  // defined, so the per-route `|| 'http://localhost:3009'` fallbacks are never reached.
  // BFF routes call ${DASHBOARD_API_URL}/api/v1/<resource>, which the gateway strips to
  // /api/v1/<resource> on dashboard-service. No route-file edits needed.
  env: {
    DASHBOARD_API_URL: process.env.DASHBOARD_API_URL || 'https://api.baalvion.com/api/v1/platform/dashboard',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@genkit-ai/core', 'genkit'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
};

export default nextConfig;
