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
  // sharp (src/app/api/image/route.ts) ships a native binary per-platform —
  // same reasoning as the Genkit/OpenTelemetry entries below, plus it needs
  // to stay out of the Edge bundle graph entirely.
  serverExternalPackages: [
    'sharp',
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
      // Phase 4 SEO/IA consolidation: cruise-ship-accident-lawyer-florida
      // substantially restated cruise-ship-accident-lawyer-miami's central legal
      // point (ticket-contract forum-selection clause -> S.D. Fla. federal court,
      // same Carnival v. Shute citation, same 46 U.S.C. § 30508 deadline) without
      // adding proportionate unique content, and already linked to the Miami page
      // as the more detailed treatment. Consolidated rather than left as a
      // near-duplicate competing for the same search intent.
      { source: '/cruise-ship-accident-lawyer-florida', destination: '/cruise-ship-accident-lawyer-miami', permanent: true },
      // navigating-the-divorce-process (legacy CMS stub, ~19 words, no
      // jurisdiction stated) covers exactly the ground how-divorce-works-in-the-us
      // already covers in full (2,700+ words, explicit state-by-state framing).
      // Redirected rather than rewritten into a third competing divorce-process page.
      { source: '/article/navigating-the-divorce-process', destination: '/family-law/how-divorce-works-in-the-us', permanent: true },
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
    // previously forced unoptimized:true (images render at source
    // resolution/format — a real LCP cost). A custom loader replaces the
    // built-in optimizer with our own sharp-based resize endpoint
    // (src/app/api/image/route.ts) instead, so images stay resized + WebP
    // without per-image Vercel cost. Because the loader owns the whole URL,
    // Next skips its own remotePatterns/dangerouslyAllowSVG host
    // validation — the real host allowlist (SSRF-relevant, since that route
    // fetches server-side) now lives in route.ts's ALLOWED_HOSTS, kept in
    // sync with the hosts this used to list here (site origin,
    // api.baalvion.com, firebasestorage.googleapis.com,
    // lh3.googleusercontent.com).
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    // Candidate widths next/image will request from the loader for a given
    // `sizes` — must match ALLOWED_WIDTHS in src/app/api/image/route.ts.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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