import type { NextConfig } from 'next';

// Next.js dev (webpack HMR + react-refresh) runs on eval() and a localhost websocket; a CSP without
// 'unsafe-eval'/ws breaks the client bundle in dev (nothing hydrates). Relax in dev only; prod stays strict.
const isDev = process.env.NODE_ENV !== 'production';

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
      `script-src 'self' 'unsafe-inline' https://apis.google.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://api.baalvion.com wss://api.baalvion.com https://*.firebaseio.com https://*.googleapis.com${isDev ? ' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*' : ''}`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Keep the server-only Genkit + OpenTelemetry runtime external so Next leaves it as a runtime
  // require() instead of bundling and statically analysing its dynamic `require(expr)` calls
  // (@opentelemetry/instrumentation, require-in-the-middle, protobufjs, express). Removes the
  // "Critical dependency: the request of a dependency is an expression" build warnings with no
  // behaviour change — src/ai/* is `server-only`, reached only through flows / route handlers.
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/ai',
    '@genkit-ai/google-genai',
    'dotprompt',
    'handlebars',
    '@opentelemetry/sdk-node',
    '@opentelemetry/api',
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    'import-in-the-middle',
    'protobufjs',
    'express',
  ],
  // Single env-driven base for the ~61 BFF route handlers. Defaulting it here makes
  // process.env.BRAND_API_URL always defined, so the per-file `|| 'http://localhost:3006'`
  // fallbacks are never reached (no individual route edits needed). The service's
  // additive `/api` compat mount makes the BFF's `${BRAND_API_URL}/api/<resource>` resolve.
  env: {
    BRAND_API_URL: process.env.BRAND_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/brand-connector',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    const brandTarget =
      process.env.BRAND_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/brand-connector';
    return [
      // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
      { source: '/auth-bff/:path*', destination: `${authTarget}/:path*` },
      // Same-origin proxy for the fb-compat REST shim (bare resource names) → backend `/api/v1` mount.
      // Keeps the strict production CSP (`connect-src 'self'`) satisfied; forwards the Bearer header.
      { source: '/brand-bff/:path*', destination: `${brandTarget}/api/v1/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
