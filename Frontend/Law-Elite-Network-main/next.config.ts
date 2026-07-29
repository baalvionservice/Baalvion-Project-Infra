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
const siteOrigin = originOf(process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com');
const siteUrl = (() => {
  try {
    return siteOrigin ? new URL(siteOrigin) : null;
  } catch {
    return null;
  }
})();
const siteHostname = siteUrl?.hostname || '';
// next/image remotePatterns requires 'http' | 'https' specifically — derive it from the
// actual site origin instead of assuming https, so this also matches local dev
// (NEXT_PUBLIC_APP_URL=http://localhost:...).
const siteProtocol: 'http' | 'https' = siteUrl?.protocol === 'http:' ? 'http' : 'https';

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
      // 'self' + data: (inline generated SVG artwork) + api.baalvion.com (cms-service-
      // hosted generated artwork) + firebasestorage/googleusercontent (real user/OAuth
      // avatars) — no stock/placeholder image hosts.
      "img-src 'self' data: blob: https://api.baalvion.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.razorpay.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${extraConnect} https://api.baalvion.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.googleapis.com https://*.algolianet.com https://*.algolia.net https://www.google-analytics.com https://*.google-analytics.com${
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
      // Scoped relaxation for the admin CMS live-preview iframe: only requests carrying
      // ?previewToken=... (set by /api/preview after validating the token with cms-service)
      // get a permissive frame-ancestors. Every other request keeps frame-ancestors 'none'
      // from the block above. Modern browsers prefer CSP frame-ancestors over
      // X-Frame-Options when both are present, so this safely supersedes SAMEORIGIN here.
      {
        source: '/article/:slug*',
        has: [{ type: 'query', key: 'previewToken' }],
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://admin.baalvion.com",
          },
        ],
      },
    ];
  },

  images: {
    // Only self, the cms-service origin (auto-generated article artwork), and
    // real user/OAuth-avatar hosts — no stock/placeholder image hosts.
    remotePatterns: [
      // `resolveArticleImage()` (src/lib/article-art.ts) builds an absolute
      // `${SITE}/article-art/<slug>.png` URL even for our own self-hosted static
      // assets. next/image treats any absolute URL as "remote" regardless of
      // origin, so without this pattern every article hero image 400s through
      // /_next/image (hostname not configured under images in next.config.js).
      ...(siteHostname
        ? [
            {
              protocol: siteProtocol,
              hostname: siteHostname,
              pathname: '/**',
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'api.baalvion.com',
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
    // Mobile performance optimizations — serve modern formats + right-sized
    // variants instead of one oversized source image to every device.
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Every SVG served through next/image here is our own deterministically generated
    // artwork (@baalvion/illustrations) — never user-uploaded — so it's safe to allow.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;