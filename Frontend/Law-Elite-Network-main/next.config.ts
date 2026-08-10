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
      // AdSense loads its ad-delivery script from *.googlesyndication.com
      // (not just pagead2) and *.doubleclick.net/*.googleadservices.com for
      // remarketing/ad-service tags. api.baalvion.com is the cms-service
      // analytics collect.js — it was in connect-src/img-src but missing here,
      // so the site's own tracker was silently CSP-blocked on every page.
      `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://api.baalvion.com https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com https://*.google.com${
        isDev ? " 'unsafe-eval'" : ''
      }`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // 'self' + data:/blob: (inline generated SVG artwork, client-side previews) +
      // https: (catch-all for content/CMS media and ad-creative images — ad
      // networks and editorial uploads add new image hosts constantly, and a
      // fixed per-host allowlist here previously caused the site's OWN
      // analytics tracker to be silently CSP-blocked; images can't execute
      // script, so allowing any https host carries no XSS risk, only a
      // hotlinking one we accept for this public content site).
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // *.adtrafficquality.google is Google's ad-traffic-quality/fraud check (sodar) that
      // AdSense pings from the page; *.googlesyndication.com/*.doubleclick.net/*.google.com
      // are ad-request + measurement calls. All three were previously unlisted, so once
      // ads go live they'd fail silently in the console instead of actually loading.
      `connect-src 'self' ${extraConnect} https://api.baalvion.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.googleapis.com https://*.algolianet.com https://*.algolia.net https://www.google-analytics.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google${
        isDev
          ? ' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*'
          : ''
      }`,
      // Ad creatives render in iframes served from googleads.g.doubleclick.net and
      // tpc.googlesyndication.com — without these, approved ads simply never paint.
      "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
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

  // Five policy pages (attribution/ownership/copyright/DMCA/affiliate) were
  // consolidated into one Editorial, DMCA & Disclosure Policy page; /disclaimer
  // was dropped as a near-duplicate of the Terms of Service disclaimer section.
  // Permanent redirects so bookmarks, backlinks, and any already-indexed URLs
  // don't 404.
  async redirects() {
    return [
      { source: '/source-attribution-policy', destination: '/editorial-disclosure-policy', permanent: true },
      { source: '/ownership-disclosure', destination: '/editorial-disclosure-policy', permanent: true },
      { source: '/dmca-policy', destination: '/editorial-disclosure-policy', permanent: true },
      { source: '/copyright-policy', destination: '/editorial-disclosure-policy', permanent: true },
      { source: '/affiliate-disclosure', destination: '/editorial-disclosure-policy', permanent: true },
      { source: '/disclaimer', destination: '/terms-of-service', permanent: true },
      // Trailing-slash duplicates of root-flat article/category URLs -- the
      // canonical form (articleUrl() in src/lib/article-url.ts and the
      // category-hub routes) never has a trailing slash, but these specific
      // slugs were also being linked/indexed with one, creating a duplicate
      // crawlable URL for the same content.
      { source: '/oil-rig-injury-lawyer/', destination: '/oil-rig-injury-lawyer', permanent: true },
      { source: '/offshore-accident-statute-of-limitations/', destination: '/offshore-accident-statute-of-limitations', permanent: true },
      { source: '/offshore-accident-lawyer/', destination: '/offshore-accident-lawyer', permanent: true },
      { source: '/maritime-offshore-injury-law/', destination: '/maritime-offshore-injury-law', permanent: true },
      { source: '/maritime-accident-lawyer/', destination: '/maritime-accident-lawyer', permanent: true },
      { source: '/maintenance-and-cure-explained/', destination: '/maintenance-and-cure-explained', permanent: true },
      { source: '/legal-aid-and-free-legal-help-in-the-us/', destination: '/legal-aid-and-free-legal-help-in-the-us', permanent: true },
    ];
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
    // Vercel's /_next/image optimizer is gated behind a paid quota on this
    // project — every request 402s (X-Vercel-Error: OPTIMIZED_IMAGE_REQUEST_
    // PAYMENT_REQUIRED) regardless of how remotePatterns is configured, which
    // silently broke every image on the site. unoptimized:true makes next/image
    // render the original file directly (still respects remotePatterns for
    // which hosts are allowed), trading resize/AVIF-WebP conversion for images
    // that actually render without a Vercel plan/billing change.
    //
    // This fix already merged, but the deployment that should have shipped it
    // was rejected by Vercel's account-wide Hobby-plan build-rate limit
    // (commit status: "Deployment rate limited — retry in 24 hours") — so
    // production kept serving the pre-fix build. That window has passed;
    // this comment-only touch gives Vercel's turbo-ignore a reason to
    // re-attempt the deploy for this app instead of skipping it as unaffected.
    unoptimized: true,
    // Self, the cms-service origin, known avatar hosts, PLUS a catch-all for
    // any other https host. Content authors and ad networks add new image
    // hosts constantly (new CMS media bucket, a contributor's avatar
    // provider, a new ad creative CDN) — a fixed allowlist means every new
    // host 400s through next/image ("hostname not configured") until someone
    // edits this file and redeploys, which is the same failure class as the
    // original bug, just moved. Safe to leave wide open here because
    // unoptimized:true means Next never proxy-fetches these URLs server-side
    // (no SSRF surface) — the browser fetches them directly, same as a plain
    // <img src>. The explicit entries below are kept for documentation/intent
    // even though the wildcard already covers them.
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
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      // Dev-only so `next dev` also tolerates http image sources (e.g. a
      // teammate's local MinIO/S3 emulator) without needing config edits.
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: '**',
              pathname: '/**',
            },
          ]
        : []),
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