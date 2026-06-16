
/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy. `unsafe-eval` is gated to development only (Next's dev
// runtime needs it); production drops it. `unsafe-inline` is retained for Next's
// inline bootstrap/styles. The dangerous sinks (object/base-uri/frame-ancestors)
// are locked down. img/connect allow https: because the app pulls media + talks to
// the env-driven jobs-service gateway / Keycloak over TLS.
const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspHeader
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];


const nextConfig = {
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
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Env-driven base — defaulting here neutralises per-route `|| 'http://localhost:3002/api/v1'`
  // fallbacks (jobs-service via gateway). Auth stays on Keycloak (Phase 4 — not migrated yet).
  env: {
    NEXT_PUBLIC_JOBS_SERVICE_URL: process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'http://localhost:3002/api/v1',
  },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
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
      {
        protocol: 'https',
        hostname: 'www.cdprojektred.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async redirects() {
    return [
      { source: '/diversity', destination: '/about/diversity', permanent: true },
      { source: '/team', destination: '/about/team', permanent: true },
      { source: '/careers/internship', destination: '/careers/internship-program', permanent: true },
      { source: '/admin/jobs/create', destination: '/jobs', permanent: true },
      { source: '/admin/jobs/edit/:jobId', destination: '/jobs', permanent: true },
      { source: '/admin/calendar', destination: '/interviews', permanent: true },
      { source: '/my-account/interviews', destination: '/my-account?tab=interviews', permanent: false },
      { source: '/my-account/offers', destination: '/my-account?tab=offers', permanent: false },
      { source: '/my-account/profile', destination: '/my-account?tab=settings', permanent: false },
      { source: '/my-account/settings', destination: '/my-account?tab=settings', permanent: false },
    ]
  },
  async headers() {
    return [
        {
            source: '/:path*',
            headers: securityHeaders,
        },
    ]
  },
};

module.exports = nextConfig;
