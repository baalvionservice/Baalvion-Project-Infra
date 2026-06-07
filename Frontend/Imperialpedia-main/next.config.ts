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
    const admin = process.env.NEXT_PUBLIC_ADMIN_PLATFORM_URL || 'http://localhost:3030';
    return [
      { source: '/admin', destination: `${admin}/dashboard`, permanent: false },
      { source: '/admin/:path*', destination: `${admin}/dashboard`, permanent: false },
      { source: '/editor', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/editor/:path*', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/writer', destination: `${admin}/cms/posts`, permanent: false },
      { source: '/writer/:path*', destination: `${admin}/cms/posts`, permanent: false },
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com",
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://picsum.photos https://images.unsplash.com https://placehold.co https://imperialpedia.com https://www.investopedia.com https://www.google-analytics.com https://*.googlesyndication.com https://*.g.doubleclick.net",
              "font-src 'self'",
              // Dev: allow the local imperialpedia-service (:3004) and cms-service (:3018)
              // that client components (Market Movers, community, search) fetch directly.
              "connect-src 'self' https://api.baalvion.com http://localhost:3004 http://localhost:3018 https://www.google-analytics.com https://*.google-analytics.com https://*.googlesyndication.com",
              "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.investopedia.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imperialpedia.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Mobile performance optimizations
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
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
