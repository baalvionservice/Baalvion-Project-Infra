import type { NextConfig } from "next";

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
  reactStrictMode: true,
  // Self-contained server bundle so the Dockerfile's `.next/standalone` + server.js exist.
  // Gated off on win32 (Next standalone symlink emission is unreliable on Windows dev boxes);
  // Docker/CI builds run on Linux where standalone is emitted correctly.
  output: process.platform === 'win32' ? undefined : 'standalone',
  typescript: {
    // Type errors will now fail the build — all type issues must be resolved.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint is a separate CI gate (`npm run lint`), not a production-build blocker — legacy lint
    // debt (no-console, unused vars, genkit deps) shouldn't fail the artifact. Type-checking
    // stays enforced above (ignoreBuildErrors: false), which is what guards build correctness.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
    return [
      { source: '/auth-bff/:path*', destination: `${authTarget}/:path*` },
      // Investopedia-style A–Z glossary URLs (e.g. /terms-beginning-with-a,
      // /terms-beginning-with-num) map onto the real /terms/[letter] listing route.
      { source: '/terms-beginning-with-:letter', destination: '/terms/:letter' },
    ];
  },
  async redirects() {
    // The in-app admin/editor/writer panels are RETIRED in favour of the central
    // admin-platform (CMS console + workflow). Bounce them there.
    // Localhost is dev-only; in production an unset var collapses to '' so the
    // /admin redirects resolve same-origin instead of bouncing users to localhost.
    const admin =
      process.env.NEXT_PUBLIC_ADMIN_PLATFORM_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3030');
    return [
      { source: '/admin', destination: `${admin}/dashboard`, permanent: false },
      { source: '/admin/:path*', destination: `${admin}/dashboard`, permanent: false },
      { source: '/editor', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/editor/:path*', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/writer', destination: `${admin}/cms/posts`, permanent: false },
      { source: '/writer/:path*', destination: `${admin}/cms/posts`, permanent: false },
      // /home was a duplicate second homepage implementation (retired) — the
      // canonical homepage is /.
      { source: '/home', destination: '/', permanent: true },
      // /research-ai was a non-functional stub (noindex, placeholder input box,
      // never shipped) — retired in favour of the real AI tool suite.
      { source: '/research-ai', destination: '/ai-analyst', permanent: true },
      // /market and /markets were both retired when the standalone markets page
      // was removed in favour of the dynamic /market-news hub (see commit
      // 7383eadc) — Search Console still has both indexed. /markets used to
      // 301 to /market, which no longer exists, producing a dead redirect
      // chain (308 → 404); both now resolve straight to the real hub.
      { source: '/market', destination: '/market-news', permanent: true },
      { source: '/markets', destination: '/market-news', permanent: true },
      // Google is a subsidiary of Alphabet, which already has its own entity
      // page — redirect instead of creating a near-duplicate second profile.
      { source: '/companies/google', destination: '/companies/alphabet', permanent: true },
      // /financial-tools/portfolio and /financial-tools/retirement were the
      // old locations before the calculators hub was reorganized — the tools
      // now live at the top level.
      { source: '/financial-tools/portfolio', destination: '/portfolio', permanent: true },
      { source: '/financial-tools/retirement', destination: '/retirement', permanent: true },
      // These /categories/<slug> archives 404 because no article's category
      // taxonomy string slugifies to an exact match — but each has a real,
      // populated top-level hub page. Send crawlers/visitors there instead.
      { source: '/categories/bonds', destination: '/bonds', permanent: true },
      { source: '/categories/etfs', destination: '/etfs', permanent: true },
      { source: '/categories/options', destination: '/options', permanent: true },
      { source: '/categories/banking', destination: '/banking', permanent: true },
      { source: '/categories/personal-finance', destination: '/personal-finance', permanent: true },
      // The entire articles section (hub + every individual article) moved to
      // /financial-intelligence. Old thin-topic consolidations below resolve
      // straight to their final destination in one hop; everything else under
      // /articles/* falls through to the catch-all rule at the end.
      { source: '/articles', destination: '/financial-intelligence', permanent: true },
      // Consolidate near-duplicate article topics into one comprehensive guide
      // each, instead of publishing several thin pages that would cannibalize
      // the same search intent.
      { source: '/articles/emergency-funds', destination: '/financial-intelligence/emergency-fund-guide', permanent: true },
      { source: '/articles/gdp-growth', destination: '/financial-intelligence/complete-guide-to-gdp', permanent: true },
      { source: '/articles/gdp-limitations', destination: '/financial-intelligence/complete-guide-to-gdp', permanent: true },
      { source: '/articles/nominal-vs-real-gdp', destination: '/financial-intelligence/complete-guide-to-gdp', permanent: true },
      { source: '/articles/economic-growth', destination: '/financial-intelligence/complete-guide-to-gdp', permanent: true },
      { source: '/articles/loan-types-explained', destination: '/financial-intelligence/complete-guide-to-personal-loans', permanent: true },
      { source: '/articles/loan-eligibility-and-approval', destination: '/financial-intelligence/complete-guide-to-personal-loans', permanent: true },
      { source: '/articles/loan-repayment-strategies', destination: '/financial-intelligence/complete-guide-to-personal-loans', permanent: true },
      { source: '/articles/managing-student-loan-debt', destination: '/financial-intelligence/student-loan-repayment-plans', permanent: true },
      // Catch-all: any remaining /articles/<slug> hit (bookmarks, external
      // backlinks, search-engine cache) 301s to its new home so nothing 404s
      // and link equity carries over.
      { source: '/articles/:slug*', destination: '/financial-intelligence/:slug*', permanent: true },
      // Back-compat: the old query-param World URLs now live at clean paths.
      // /world?region=us → /world/us, /world?region=world → /world.
      {
        source: '/world',
        has: [{ type: 'query', key: 'region', value: '(?<region>us|europe|asia|china|emerging)' }],
        destination: '/world/:region',
        permanent: true,
      },
      {
        source: '/world',
        has: [{ type: 'query', key: 'region', value: 'world' }],
        destination: '/world',
        permanent: true,
      },
    ];
  },
  async headers() {
    // Next.js dev (webpack HMR + react-refresh) runs on eval(); a prod CSP without
    // 'unsafe-eval' is correct, but dev needs it or the client bundle won't hydrate.
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Google Analytics / Tag Manager + AdSense hosts are allow-listed so analytics
              // works when NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_ADSENSE_CLIENT are set; the scripts
              // themselves only render when those env vars are configured (see Analytics.tsx).
              // api.baalvion.com is the cms-service tracker UnifiedAnalytics.tsx injects
              // (`/api/v1/collect.js`) — without it in script-src(-elem) the browser blocks
              // the tag and first-party analytics silently never fires.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://api.baalvion.com`,
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://api.baalvion.com",
              "style-src 'self' 'unsafe-inline'",
              // 'self' + data: (inline generated SVG artwork) + imperialpedia.com +
              // api.baalvion.com (cms-service-hosted generated artwork) are the only
              // image sources — no stock/placeholder/third-party image hosts.
              "img-src 'self' data: https://imperialpedia.com https://api.baalvion.com https://www.google-analytics.com https://*.googlesyndication.com https://*.g.doubleclick.net",
              "font-src 'self'",
              // Dev: allow the local imperialpedia-service (:3004) and cms-service (:3018)
              // that client components (Market Movers, community, search) fetch directly.
              "connect-src 'self' https://api.baalvion.com http://localhost:3004 http://localhost:3018 https://www.google-analytics.com https://*.google-analytics.com https://*.googlesyndication.com",
              // www.googletagmanager.com/ns.html is the GTM <noscript> fallback iframe.
              "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://www.googletagmanager.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    // Only self (imperialpedia.com) and the cms-service origin that hosts
    // auto-generated article artwork — no stock/placeholder/third-party hosts.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imperialpedia.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.baalvion.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Mobile performance optimizations
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Every SVG served through next/image here is our own deterministically generated
    // artwork (@baalvion/illustrations) — never user-uploaded — so it's safe to allow;
    // `contentSecurityPolicy` below still sandboxes the optimized-image response.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },
  // Compression
  compress: true,
  // PWA-like optimizations
  poweredByHeader: false,
  // Bundle analyzer for optimization
  webpack: (config, { dev, isServer }) => {
    // Mobile performance optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
