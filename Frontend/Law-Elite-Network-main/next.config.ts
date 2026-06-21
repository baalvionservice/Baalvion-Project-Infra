import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

function originOf(url?: string): string {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
const gatewayOrigin = originOf(process.env.NEXT_PUBLIC_GATEWAY_URL);

const wsExplicit = originOf(process.env.NEXT_PUBLIC_WS_URL);
const wsDerived = apiOrigin ? apiOrigin.replace(/^http/, 'ws') : '';

const wsOrigin = wsExplicit
  ? wsExplicit.replace(/^http/, 'ws')
  : wsDerived;

const extraConnect = [
  apiOrigin,
  gatewayOrigin,
  wsOrigin,
]
  .filter(Boolean)
  .join(' ');

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
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
      `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://pagead2.googlesyndication.com${
        isDev ? " 'unsafe-eval'" : ''
      }`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://*.razorpay.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${extraConnect} https://api.baalvion.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.googleapis.com https://*.algolianet.com https://*.algolia.net${
        isDev
          ? ' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*'
          : ''
      }`,
      "frame-src 'self' https://*.razorpay.com https://api.razorpay.com",
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
  // Self-contained server bundle so the Dockerfile's `.next/standalone` + server.js exist.
  // Gated off on win32 (Next standalone symlink emission is unreliable on Windows dev boxes);
  // Docker/CI builds run on Linux where standalone is emitted correctly.
  output: process.platform === 'win32' ? undefined : 'standalone',

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
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
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;