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
  // Pages with async `generateMetadata` (CMS-backed pages under `dynamic = 'force-dynamic'`)
  // stream <title>/<meta> tags into the body and rely on React 19 hoisting them into <head>
  // client-side. Crawlers that only parse the raw HTML response (Screaming Frog, and any bot
  // not in Next's default `HTML_LIMITED_BOT_UA_RE` list) see those tags sitting in <body> and
  // flag "meta description outside head". `htmlLimitedBots` forces those bots to receive the
  // old blocking (non-streamed) render instead. This *replaces* Next's default bot list rather
  // than extending it, so the default set (Googlebot's non-JS crawlers, Bingbot, etc. — see
  // node_modules/next/dist/shared/lib/router/utils/html-bots.js) is reproduced here verbatim
  // with Screaming Frog appended.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Screaming Frog/i,
  // Self-contained server bundle so the Dockerfile's `.next/standalone` + server.js exist.
  // Gated off on win32 (Next standalone symlink emission is unreliable on Windows dev boxes);
  // Docker/CI builds run on Linux where standalone is emitted correctly.

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
      // ── TEMPORARY: categories retired pending AdSense review (2026-09-03) ──
      // These 54 categories don't yet meet the content depth bar. Unpublished in the
      // CMS AND redirected here, because CategoryFeed falls back to bundled demo
      // articles when a category has zero live posts — an empty category page would
      // silently show placeholder content dressed as real, which is worse than 404.
      // Remove this block (and re-add the category to the nav) once its articles are
      // republished. Wildcard covers both the hub page and any individual article
      // URL under it, so nothing 404s in the meantime.
      //
      // 2026-09-04: 8 of the 54 (advanced-budgeting, budget-rules, budgeting-apps,
      // emergency-fund, family-budget, monthly-budget, saving-money, student-budget)
      // aren't thin — they're a consolidation. Each had only 3-5 articles, so as
      // standalone category pages they read as the same thin-content pattern as the
      // other 46. Their articles were recategorized into budgeting-basics (37 total
      // now), not archived — see recategorize-and-archive.cjs. budgeting-basics
      // itself stays live and out of this block.
      { source: '/advanced-budgeting', destination: '/', permanent: true },
      { source: '/advanced-budgeting/:path*', destination: '/', permanent: true },
      { source: '/app-reviews', destination: '/', permanent: true },
      { source: '/app-reviews/:path*', destination: '/', permanent: true },
      { source: '/auto-loans', destination: '/', permanent: true },
      { source: '/auto-loans/:path*', destination: '/', permanent: true },
      { source: '/banking', destination: '/', permanent: true },
      { source: '/banking/:path*', destination: '/', permanent: true },
      { source: '/banking-reviews', destination: '/', permanent: true },
      { source: '/banking-reviews/:path*', destination: '/', permanent: true },
      { source: '/bonds', destination: '/', permanent: true },
      { source: '/bonds/:path*', destination: '/', permanent: true },
      { source: '/brokers', destination: '/', permanent: true },
      { source: '/brokers/:path*', destination: '/', permanent: true },
      { source: '/budget-rules', destination: '/', permanent: true },
      { source: '/budget-rules/:path*', destination: '/', permanent: true },
      { source: '/budgeting-apps', destination: '/', permanent: true },
      { source: '/budgeting-apps/:path*', destination: '/', permanent: true },
      { source: '/calendar', destination: '/', permanent: true },
      { source: '/calendar/:path*', destination: '/', permanent: true },
      { source: '/cd-rates', destination: '/', permanent: true },
      { source: '/cd-rates/:path*', destination: '/', permanent: true },
      { source: '/checking', destination: '/', permanent: true },
      { source: '/checking/:path*', destination: '/', permanent: true },
      { source: '/commodities', destination: '/', permanent: true },
      { source: '/commodities/:path*', destination: '/', permanent: true },
      { source: '/credit', destination: '/', permanent: true },
      { source: '/credit/:path*', destination: '/', permanent: true },
      { source: '/credit-cards', destination: '/', permanent: true },
      { source: '/credit-cards/:path*', destination: '/', permanent: true },
      { source: '/crypto', destination: '/', permanent: true },
      { source: '/crypto/:path*', destination: '/', permanent: true },
      { source: '/cryptocurrency', destination: '/', permanent: true },
      { source: '/cryptocurrency/:path*', destination: '/', permanent: true },
      { source: '/debt', destination: '/', permanent: true },
      { source: '/debt/:path*', destination: '/', permanent: true },
      { source: '/earnings', destination: '/', permanent: true },
      { source: '/earnings/:path*', destination: '/', permanent: true },
      { source: '/economy', destination: '/', permanent: true },
      { source: '/economy/:path*', destination: '/', permanent: true },
      { source: '/emergency-fund', destination: '/', permanent: true },
      { source: '/emergency-fund/:path*', destination: '/', permanent: true },
      { source: '/etfs', destination: '/', permanent: true },
      { source: '/etfs/:path*', destination: '/', permanent: true },
      { source: '/family-budget', destination: '/', permanent: true },
      { source: '/family-budget/:path*', destination: '/', permanent: true },
      { source: '/fed', destination: '/', permanent: true },
      { source: '/fed/:path*', destination: '/', permanent: true },
      { source: '/financial-calculators', destination: '/', permanent: true },
      { source: '/financial-calculators/:path*', destination: '/', permanent: true },
      { source: '/financial-independence', destination: '/', permanent: true },
      { source: '/financial-independence/:path*', destination: '/', permanent: true },
      { source: '/fiscal-policy', destination: '/', permanent: true },
      { source: '/fiscal-policy/:path*', destination: '/', permanent: true },
      { source: '/gdp', destination: '/', permanent: true },
      { source: '/gdp/:path*', destination: '/', permanent: true },
      { source: '/global', destination: '/', permanent: true },
      { source: '/global/:path*', destination: '/', permanent: true },
      { source: '/indicators', destination: '/', permanent: true },
      { source: '/indicators/:path*', destination: '/', permanent: true },
      { source: '/inflation', destination: '/', permanent: true },
      { source: '/inflation/:path*', destination: '/', permanent: true },
      { source: '/interest-rates', destination: '/', permanent: true },
      { source: '/interest-rates/:path*', destination: '/', permanent: true },
      { source: '/investing', destination: '/', permanent: true },
      { source: '/investing/:path*', destination: '/', permanent: true },
      { source: '/live-market-news', destination: '/', permanent: true },
      { source: '/live-market-news/:path*', destination: '/', permanent: true },
      { source: '/loan-reviews', destination: '/', permanent: true },
      { source: '/loan-reviews/:path*', destination: '/', permanent: true },
      { source: '/loans', destination: '/', permanent: true },
      { source: '/loans/:path*', destination: '/', permanent: true },
      { source: '/monetary-policy', destination: '/', permanent: true },
      { source: '/monetary-policy/:path*', destination: '/', permanent: true },
      { source: '/money-management', destination: '/', permanent: true },
      { source: '/money-management/:path*', destination: '/', permanent: true },
      { source: '/money-market', destination: '/', permanent: true },
      { source: '/money-market/:path*', destination: '/', permanent: true },
      { source: '/monthly-budget', destination: '/', permanent: true },
      { source: '/monthly-budget/:path*', destination: '/', permanent: true },
      { source: '/mortgages', destination: '/', permanent: true },
      { source: '/mortgages/:path*', destination: '/', permanent: true },
      { source: '/mutual-funds', destination: '/', permanent: true },
      { source: '/mutual-funds/:path*', destination: '/', permanent: true },
      { source: '/options', destination: '/', permanent: true },
      { source: '/options/:path*', destination: '/', permanent: true },
      { source: '/personal-finance', destination: '/', permanent: true },
      { source: '/personal-finance/:path*', destination: '/', permanent: true },
      { source: '/planning', destination: '/', permanent: true },
      { source: '/planning/:path*', destination: '/', permanent: true },
      { source: '/portfolio', destination: '/', permanent: true },
      { source: '/portfolio/:path*', destination: '/', permanent: true },
      { source: '/real-estate', destination: '/', permanent: true },
      { source: '/real-estate/:path*', destination: '/', permanent: true },
      { source: '/retirement', destination: '/', permanent: true },
      { source: '/retirement/:path*', destination: '/', permanent: true },
      { source: '/saving-money', destination: '/', permanent: true },
      { source: '/saving-money/:path*', destination: '/', permanent: true },
      { source: '/savings', destination: '/', permanent: true },
      { source: '/savings/:path*', destination: '/', permanent: true },
      { source: '/student-budget', destination: '/', permanent: true },
      { source: '/student-budget/:path*', destination: '/', permanent: true },
      { source: '/student-loans', destination: '/', permanent: true },
      { source: '/student-loans/:path*', destination: '/', permanent: true },
      { source: '/tax-software', destination: '/', permanent: true },
      { source: '/tax-software/:path*', destination: '/', permanent: true },
      { source: '/unemployment', destination: '/', permanent: true },
      { source: '/unemployment/:path*', destination: '/', permanent: true },
      // ── end temporary retirement block ──

      { source: '/admin', destination: `${admin}/dashboard`, permanent: false },
      { source: '/admin/:path*', destination: `${admin}/dashboard`, permanent: false },
      { source: '/editor', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/editor/:path*', destination: `${admin}/cms/workflows`, permanent: false },
      { source: '/writer', destination: `${admin}/cms/posts`, permanent: false },
      { source: '/writer/:path*', destination: `${admin}/cms/posts`, permanent: false },
      // /home was a duplicate second homepage implementation (retired) — the
      // canonical homepage is /.
      { source: '/home', destination: '/', permanent: true },
      // /privacy canonical redirect to /privacy-policy
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      // Redirect en‑dash version of the stock‑market‑circuit‑breakers slug to the proper hyphenated path
      { source: '/stocks/stock%E2%80%91market%E2%80%91circuit%E2%80%91breakers', destination: '/stocks/stock-market-circuit-breakers', permanent: true },
      // /research-ai used to redirect to /ai-analyst here, but /ai-analyst is
      // itself permanently removed (see REMOVED_PATHS in middleware.ts) — that
      // made this a 301 chaining straight into a 410, which Google flags as a
      // broken redirect rather than a clean removal. /research-ai now 410s
      // directly at the edge instead.
      // /market and /markets were both retired when the standalone markets page
      // was removed in favour of the dynamic /market-news hub (see commit
      // 7383eadc) — Search Console still has both indexed. /markets used to
      // 301 to /market, which no longer exists, producing a dead redirect
      // chain (308 → 404); both now resolve straight to the real hub.
      { source: '/market', destination: '/market-news', permanent: true },
      { source: '/markets', destination: '/market-news', permanent: true },
      // /companies/google used to redirect to /companies/alphabet, but the
      // entire /companies section (including /companies/alphabet) is now
      // permanently 410'd (see REMOVED_PATHS in middleware.ts) — that made this
      // a 301 chaining into a 410. Removed; middleware's blanket /companies/
      // prefix rule now 410s it directly in one hop.
      // /financial-tools/portfolio and /financial-tools/retirement were the
      // old locations before the calculators hub was reorganized — the tools
      // now live at the top level.
      { source: '/financial-tools/portfolio', destination: '/', permanent: true },
      { source: '/financial-tools/retirement', destination: '/', permanent: true },
      // The old /glossary section (letter index + term-detail pages) was
      // removed in favour of /terms/[letter]/[slug] — still indexed and
      // linked externally. /glossary/letter/k → /terms/k covers the old
      // index route; /glossary/:slug → /terms/:slug covers both old bare
      // letter pages (/glossary/l) and old term-slug pages, and falls
      // through to the /terms/[letter] page's own bare-slug-to-term
      // redirect for the latter.
      { source: '/glossary/letter/:letter', destination: '/terms/:letter', permanent: true },
      { source: '/glossary/:slug', destination: '/terms/:slug', permanent: true },
      // Search Console flagged these as 404s with no matching href, redirect, or
      // sitemap entry anywhere in the codebase — most likely a hub-page slug run
      // together with an adjacent term/entity name when the report was copied.
      // Defensive redirects in case the concatenated form is genuinely being
      // requested from somewhere outside this repo (old sitemap, third-party link).
      { source: '/etfsETF', destination: '/', permanent: true },
      { source: '/inflationInflation', destination: '/', permanent: true },
      { source: '/cryptocurrencyBitcoin', destination: '/', permanent: true },
      // /markets/quote/DGS2 genuinely 404s — no data source exists for it anywhere
      // (not imperialpedia-service, not the Yahoo fallback map in worldFeed.ts/
      // marketsLoader.ts — no 2-year Treasury yield ticker exists on Yahoo under
      // any name, verified live 2026-08-26) and building one is not worth the
      // ongoing API/compute cost for a symbol this obscure. /bonds is the closest
      // real destination. (CHINA/EM/APAC/DGS30/DGS3MO used to redirect here too,
      // as regional-composite placeholders / yield tenors with no source — they
      // now have real Yahoo-backed data: FXI/EEM/VPL as region-ETF proxies and
      // ^TYX/^IRX for the two other yield tenors, same pattern EUROPE's ^STOXX
      // mapping already used — see marketsLoader.ts's CANONICAL_TO_YAHOO.)
      // A redirect is also strictly cheaper than a 404: no render, no external
      // API call, no compute — versus the 30s-revalidate quote page's renders it
      // would otherwise trigger on every crawl/backlink hit.
      { source: '/markets/quote/DGS2', destination: '/', permanent: true },
      // These /categories/<slug> archives 404 because no article's category
      // taxonomy string slugifies to an exact match — but each has a real,
      // populated top-level hub page. Send crawlers/visitors there instead.
      { source: '/categories/bonds', destination: '/', permanent: true },
      { source: '/categories/etfs', destination: '/', permanent: true },
      { source: '/categories/options', destination: '/', permanent: true },
      { source: '/categories/banking', destination: '/', permanent: true },
      { source: '/categories/personal-finance', destination: '/', permanent: true },
      // /category/<slug> was a second, older news-by-category page (NewsLayout,
      // static placeholder market widget) rendering the same categories as the
      // real live feed at /latest/<slug> — two indexable URLs for the same
      // intent. Consolidated onto /latest, the one with real market data.
      { source: '/category/:slug', destination: '/latest/:slug', permanent: true },
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
      // These 3 guide/topic slugs no longer resolve to any live CMS article (Search
      // Console still has them indexed as duplicate/canonicalized from before the
      // content was retired) — redirect to the closest live hub instead of leaving
      // a hard 404 for the residual crawl traffic and any external backlinks.
      { source: '/financial-intelligence/high-risk-vs-low-risk-stocks', destination: '/stocks', permanent: true },
      { source: '/stocks/high-risk-vs-low-risk-stocks', destination: '/stocks', permanent: true },
      { source: '/financial-intelligence/diversification', destination: '/financial-intelligence', permanent: true },
      // The entire /industries section (hub + every per-industry page) was retired —
      // only 3 industries were ever populated (finance/semiconductors/software), making
      // the whole section thin/near-empty content that AdSense review flags. This used
      // to 301 to /companies, but /companies is now itself permanently 410'd (see
      // REMOVED_PATHS in middleware.ts) — that made it a redirect chaining into a 410.
      // /industries now 410s directly at the edge instead (removed here).
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
              // *.adtrafficquality.google serves sodar2.js, the ad-traffic-quality/fraud-check
              // script AdSense's own show_ads_impl.js loads directly (a <script> tag, not just
              // a fetch/XHR ping) — it was only allow-listed under connect-src, so the script
              // load itself was still blocked and threw an uncaught error in AdSense's code on
              // every page load. Confirmed live via a headless-browser console-error sweep.
              // news.google.com serves the "Preferred Sources" widget loader (see layout.tsx's
              // literal <script> tag and PreferredSourceButton) -- it was never allow-listed here,
              // so the browser blocked the load on every single page, confirmed the same way.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://api.baalvion.com https://*.adtrafficquality.google https://news.google.com`,
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://api.baalvion.com https://*.adtrafficquality.google https://news.google.com",
              "style-src 'self' 'unsafe-inline'",
              // 'self' + data: (inline generated SVG artwork) + imperialpedia.com +
              // api.baalvion.com (cms-service-hosted generated artwork) are the only
              // image sources — no stock/placeholder/third-party image hosts.
              // *.adtrafficquality.google also serves the sodar2 fraud-check tracking pixel
              // (an <img>, not just the script above) -- unlisted here it 400'd/CSP-blocked
              // on every page once the script itself was allowed to run.
              "img-src 'self' data: https://imperialpedia.com https://api.baalvion.com https://www.google-analytics.com https://*.googlesyndication.com https://*.g.doubleclick.net https://*.adtrafficquality.google",
              "font-src 'self'",
              // Dev: allow the local imperialpedia-service (:3004) and cms-service (:3018)
              // that client components (Market Movers, community, search) fetch directly.
              // *.adtrafficquality.google is Google's ad-traffic-quality/fraud check (sodar)
              // that AdSense pings from the page; *.doubleclick.net/*.google.com are ad-request
              // + measurement calls. All three were unlisted, so once ads go live they'd fail
              // silently in the console instead of actually loading — confirmed live via a
              // console-error sweep (every page blocked the sodar connect-src call).
              // csi.gstatic.com is Google's client-side instrumentation ping that
              // show_ads_impl.js fires once the ad script actually runs -- unlisted here it
              // CSP-blocked on every page once script-src let the ad script itself load.
              "connect-src 'self' https://api.baalvion.com http://localhost:3004 http://localhost:3018 https://www.google-analytics.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://csi.gstatic.com",
              // www.googletagmanager.com/ns.html is the GTM <noscript> fallback iframe.
              // ep2.adtrafficquality.google + www.google.com are AdSense's own ad-quality
              // confirmation/verification iframes (loaded by show_ads_impl.js); news.google.com
              // is the "Preferred Sources" widget's own dialog iframe. All three were unlisted,
              // so every page blocked them with a "Framing ... violates CSP" console error,
              // which is exactly the kind of failure that gets AdSense's own crawler to report
              // it can't verify/detect the ad code on the page. Confirmed via console-error sweep.
              "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://www.googletagmanager.com https://*.adtrafficquality.google https://www.google.com https://news.google.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    // Vercel's on-demand Image Optimization API (/_next/image) is metered and
    // caps out under real traffic — once the quota is hit it returns 402
    // Payment Required for EVERY image on the site (confirmed live: raw files
    // at api.baalvion.com/uploads/* return 200, but imperialpedia.com/_next/image
    // returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED for the same file).
    // `unoptimized: true` makes next/image render the original src directly —
    // no resize/reformat pass, no Vercel billing dependency, so images can
    // never go dark sitewide again regardless of upload volume or traffic.
    // Uploaded photos are already reasonably sized and generated artwork is
    // SVG (vector, no benefit from raster resizing), so the loss of on-the-fly
    // webp/avif conversion here is a non-issue in practice.
    unoptimized: true,
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
    // Next's default (`attachment`) forces every /_next/image response to send
    // Content-Disposition: attachment, which Safari/WebKit honors even for plain
    // <img> requests — the browser treats the load as a download instead of
    // rendering it, so the homepage lead-story/article-card artwork never appears.
    // The artwork is trusted and same-origin-sandboxed via the CSP above, so there's
    // no security reason to force a download; `inline` lets it render normally.
    contentDispositionType: 'inline',
  },
  // Performance optimizations — makes Next rewrite barrel imports (`import { X } from
  // "pkg"`) into direct per-module imports, so a route that uses one icon or one chart
  // type doesn't pull the whole package's module graph into its chunk.
  experimental: {
    optimizePackageImports: [
      "@/components",
      "@/lib",
      "lucide-react",
      "recharts",
      "date-fns",
      "@tanstack/react-query",
    ],
  },
  // Compression
  compress: true,
  // PWA-like optimizations
  poweredByHeader: false,
  // NOTE: previously this config force-merged every node_modules package into a single
  // "vendors" cache group with `chunks: "all"` (custom webpack() override, removed here).
  // That put route-specific heavy deps (recharts, framer-motion, @tiptap/*,
  // embla-carousel-react — each only used on a handful of routes) into one bundle shipped
  // on literally every page, measured directly at a 605 kB shared "vendors" chunk across
  // all 373 routes. Next.js's own built-in webpack config already does more granular,
  // usage-aware chunk splitting (framework chunk, size-based lib chunks, and real
  // per-route async chunks for code-split/dynamic imports) — removing the override lets
  // that do its job instead of forcing everything into one eager bundle.
};

export default nextConfig;
