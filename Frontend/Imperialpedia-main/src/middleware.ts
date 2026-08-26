import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Imperialpedia middleware — single source of truth (the duplicate root middleware.ts was removed).
 * Responsibilities:
 *  1. Legacy /terms/[slug] → /terms/[letter]/[slug] redirect (merged from the old root middleware).
 *  2. Coarse auth gate on protected areas.
 *
 * SECURITY MODEL (P0 remediation): the access token is in memory and not visible to the edge, so
 * this gates on the un-forgeable httpOnly `baalvion_refresh` cookie set by auth-service. Per-role
 * authorization is enforced in the API + client guards.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const PROTECTED_PREFIXES = ['/admin', '/creator/dashboard', '/editor', '/writer', '/premium', '/outline'];

// The retired per-app /admin panel redirects to the central admin-platform
// console. The console URL is env-driven so production points at the real CMS;
// the hardcoded localhost is a DEV-ONLY fallback (guarded by NODE_ENV). In
// production with no env set we SKIP the redirect rather than bounce users to
// a developer's localhost.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ||
  (IS_PRODUCTION ? '' : 'http://localhost:3030/imperialpedia');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

// Bare `new NextResponse('Gone', { status: 410 })` rendered as unstyled plain
// text — technically correct for crawlers but a dead end for a real visitor
// who followed an old link/bookmark here. Self-contained HTML (matches the
// site's light editorial theme — royal-blue primary, near-black text) so a
// permanently-removed URL still looks like part of the site, with a way back.
function goneResponse(): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Page removed — Imperialpedia</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    color: #212121;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 24px;
  }
  main { max-width: 30rem; text-align: center; }
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #666666;
    border: 1px solid #e3e3e3;
    border-radius: 999px;
    padding: 4px 12px;
    margin-bottom: 20px;
  }
  h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.01em; }
  p { font-size: 15px; line-height: 1.6; color: #666666; margin: 0 0 28px; }
  a.button {
    display: inline-block;
    background: #1d4fc4;
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    border-radius: 8px;
    padding: 12px 24px;
  }
  a.button:hover { opacity: 0.9; }
</style>
</head>
<body>
<main>
  <span class="badge">410 &middot; Removed</span>
  <h1>This page has been removed</h1>
  <p>The page you're looking for was permanently taken down and no longer exists. Head back to the homepage to keep exploring.</p>
  <a class="button" href="/">Back to Imperialpedia</a>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: 410,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// SEO cleanup pass (2026-08): these URLs are permanently killed, not redirected —
// thin/duplicate hub pages, their query-filtered variants (blocking the bare path
// covers every ?query= combination of it too), a handful of thin entity pages, and
// near-duplicate articles that never merited a redirect target. 410 (not 404) tells
// crawlers the removal is intentional and permanent so they deindex rather than retry.
// /financial-intelligence/emergency-fund-guide and /financial-intelligence/high-risk-vs-low-risk-stocks
// were on the original candidate list but are excluded: the former is the live target
// of the existing `/articles/emergency-funds` redirect in next.config.ts, and the latter
// is already 301'd away there — killing either would break that redirect chain.
const REMOVED_PATHS = new Set<string>([
  '/technologies',
  '/technologies/quantum-computing',
  '/technologies/machine-learning',
  '/technologies/large-language-models',
  '/technologies/generative-ai',
  '/technologies/blockchain',
  '/companies',
  '/countries',
  '/countries/united-states',
  '/countries/taiwan',
  '/countries/south-korea',
  '/stocks/dollarcost-averaging-explained',
  '/investing/what-is-dollarcost-averaging',
  '/personal-finance/dollar-cost-averaging',
  // The 31 other /financial-intelligence/<slug> paths that used to live here were
  // REMOVED from this set (2026-08-24 audit): each one is a real, live article
  // today, just republished under its correct category (mostly /personal-finance/,
  // some /stocks/, /investing/, /portfolio/) — this route's own page.tsx already
  // does a category-agnostic slug lookup (resolveArticleForDetail) and 301s to
  // the live copy when one exists, so forcing a 410 here was destroying live
  // content's search equity instead of just letting that existing logic run.
  // Only these 2 have no live equivalent anywhere on the site, so they stay:
  '/financial-intelligence/financial-goals-framework',
  '/financial-intelligence/what-is-dollar-cost-averaging',
  // /taxes hub page permanently killed (2026-08-26): thin, empty category hub,
  // same call as /income and /insurance above. Bare path only — any individual
  // /taxes/<slug> article still resolves through the [...slug] catch-all's
  // categorySlug lookup, this just kills the hub. (/tax-software was
  // considered too but reverted — unlike /taxes it has 6 real, live,
  // internally-linked review articles, not an empty hub.)
  '/taxes',
  '/best-robo-advisers',
  '/best-personal-loans',
  '/best-online-brokers',
  '/best-mortgage-rates',
  '/best-life-insurance',
  '/best-savings-rates',
  '/best-debt-relief-companies',
  '/best-crypto-exchanges',
  '/best-cd-rates',
  // '/financial-independence-guide' (bare) removed from this set for the same
  // reason as the /financial-intelligence/* slugs above — it's a live article
  // (redirects to /personal-finance/financial-independence-guide, confirmed 200).
  '/personal-finance/financial-goals-framework',
  '/income',
  '/insurance',
  '/insurance-reviews',
  '/ai-analyst',
  '/robo-advisors',
  '/topics',
  '/search',
  '/terms-beginning-with-c',
  '/housing-market-cools-mortgage-rates',
  '/fed-holds-rates-inflation-cooling',
  '/bitcoin-surges-institutional-demand',
  '/tech-stocks-ai-spending-boom',
  '/etf-inflows-record-february',
  '/sp500-record-high-earnings',
  '/gold-hits-2400-safe-haven',
  '/terms',
  '/terms/m/marital-deduction',
  '/terms-beginning-with-num',
  '/terms-beginning-with-z',
  '/premium/subscribe',
  // /research-ai used to 301 to /ai-analyst, but /ai-analyst is itself
  // permanently killed above — that made the redirect a dead-end chain
  // (301 → 410). 410 it directly instead (see next.config.ts, where the
  // stale redirect rule was removed).
  '/research-ai',
  // The Knowledge Graph page only ever produced real connections through
  // companies/industries/technologies — all three were removed site-wide, which
  // left it rendering countries with zero edges (not a graph) while still
  // linking out to the dead entity types via NodeDetailPanel. Not worth
  // patching around; retired entirely (see knowledge-graph-service.ts removal).
  '/knowledge-map',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /markets/quote/:symbol is the one route where uppercase is the CANONICAL form,
  // not a typo — tickers are conventionally written AAPL/BTC/XAUUSD, and every
  // internal link (market-quotes.ts, MarketHighlights, MarketRow, ...) generates
  // hrefs in that case. The page itself upper-cases the param before lookup either
  // way (see page.tsx), so a lowercase URL already works — but the blanket
  // lowercase rule below was 308-redirecting literally every quote link on the
  // site (confirmed live 2026-08-26, a CheckMyLinks crawl flagged all ~50). Only
  // the static "/markets/quote/" prefix gets case-normalized here (so a caps-lock
  // typo like "/MARKETS/QUOTE/aapl" still resolves); the symbol segment is left
  // exactly as requested.
  const quoteMatch = pathname.match(/^(\/markets\/quote\/)(.+)$/i);
  if (quoteMatch) {
    const [, prefix, symbol] = quoteMatch;
    if (prefix !== '/markets/quote/') {
      const url = request.nextUrl.clone();
      url.pathname = `/markets/quote/${symbol}`;
      return NextResponse.redirect(url, 308);
    }
  } else if (pathname !== pathname.toLowerCase()) {
    // Every real slug on this site is lowercase (CMS content, static routes, terms —
    // none are cased), so an uppercase/mixed-case hit is always a typo (caps lock,
    // mobile autocap, a pasted link), never a distinct real page. Redirecting it to
    // the lowercase form first — ahead of every other rule below — means a mistyped
    // path like /WORLD lands on the real page instead of falling into the catch-all
    // route's "unknown slug" lookup, which otherwise risks a needless 404 (or, if the
    // CMS is briefly unreachable, a 500 — see articles-service.ts's deliberate
    // rethrow-on-transient-failure comment for why that particular case doesn't just
    // quietly become a 404 either). 308 (not 301) preserves the original request
    // method, matching how a case fix should behave for a POST/PUT hitting this path.
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  // Permanently killed URLs — see REMOVED_PATHS above. Checked before every other
  // rule so a removed path never falls through to auth gates or legacy redirects.
  if (REMOVED_PATHS.has(pathname)) {
    return goneResponse();
  }

  // /companies, /technologies, and /industries (list + every [slug] detail page)
  // were removed site-wide — the whole prefix 410s rather than just the handful
  // of individual paths Google had already indexed, since the route itself no
  // longer exists. (/industries/<slug> was previously left to fall through to
  // the catch-all route's resolveArticleForDetail lookup, which just 404'd —
  // still a dead end, but the wrong status code for a permanent removal.)
  if (
    pathname === '/companies' || pathname.startsWith('/companies/') ||
    pathname === '/technologies' || pathname.startsWith('/technologies/') ||
    pathname === '/industries' || pathname.startsWith('/industries/')
  ) {
    return goneResponse();
  }

  // IndexNow key verification file — search engines fetch https://<host>/<key>.txt
  // to confirm domain ownership before trusting any /api/revalidate ping. Without
  // this route the pings sent from api/revalidate/route.ts are silently discarded.
  // No app/ route can serve this: a literal `[key]` dynamic segment can't coexist
  // with the root [...slug] catch-all (Next.js requires siblings to share one
  // param name), so it's handled here instead, ahead of normal routing.
  if (INDEXNOW_KEY && pathname === `/${INDEXNOW_KEY}.txt`) {
    return new NextResponse(INDEXNOW_KEY, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Per-app admin RETIRED → central admin-platform console (before the auth gate).
  // Only redirect when the console URL is configured; in production with no env
  // set we fall through to the coarse auth gate below rather than send users to
  // localhost.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (ADMIN_CONSOLE_URL) {
      return NextResponse.redirect(new URL(ADMIN_CONSOLE_URL));
    }
  }

  // 1) Legacy terms URL structure redirect
  if (pathname.startsWith('/terms/') && pathname.split('/').length === 3) {
    const slug = pathname.split('/')[2];
    if (slug.length === 1 || slug === 'num') {
      return NextResponse.next();
    }
    const firstChar = slug.charAt(0).toLowerCase();
    const letter = /^[0-9]/.test(firstChar) ? 'num' : firstChar;
    return NextResponse.redirect(new URL(`/terms/${letter}/${slug}`, request.url), 301);
  }

  // 2) Coarse auth gate on protected areas
  // Boundary-checked (exact match or followed by "/"), not a bare startsWith: a plain
  // startsWith('/editor') also matched the public /editorial-policy page, 307-redirecting
  // every visitor there to /auth/sign-in?redirect=%2Feditorial-policy (confirmed live,
  // 2026-08-26). Same class of bug would hit e.g. a future /admins or /writers page.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected) {
    const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
    if (!hasSession) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = '/auth/sign-in';
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Case-normalization (see the top of middleware() above) needs to see every
    // page route, not just the specific ones below -- excludes API routes (a
    // redirect would break non-GET methods), _next internals, and any path with
    // a file extension (sitemap.xml, robots.txt, ads.txt, /public assets, etc.,
    // which are served case-sensitively by the filesystem/route handlers as-is).
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
    '/terms/:path*',
    '/admin/:path*',
    '/creator/dashboard/:path*',
    '/editor/:path*',
    '/writer/:path*',
    '/premium/:path*',
    '/outline/:path*',
    // IndexNow key verification file (any top-level *.txt request; the handler
    // above checks it against INDEXNOW_KEY and falls through otherwise).
    '/:indexnowFile.txt',
    // REMOVED_PATHS coverage — permanently killed URLs (see the set above).
    '/technologies',
    '/technologies/:path*',
    '/companies',
    '/companies/:path*',
    '/industries',
    '/industries/:path*',
    '/countries',
    '/countries/:path*',
    '/stocks/:path*',
    '/investing/:path*',
    '/personal-finance/:path*',
    '/financial-intelligence/:path*',
    '/best-robo-advisers',
    '/best-personal-loans',
    '/best-online-brokers',
    '/best-mortgage-rates',
    '/best-life-insurance',
    '/best-savings-rates',
    '/best-debt-relief-companies',
    '/best-crypto-exchanges',
    '/best-cd-rates',
    // Bare top-level entries in REMOVED_PATHS above with no matcher pattern of
    // their own — middleware never ran for them, so they fell through to the
    // generic [...slug] 404 instead of the intended 410 goneResponse(). A plain
    // 404 reads to Google as "maybe temporary, keep re-checking" instead of
    // "permanently gone, deindex now" — GSC showed several of these stuck in
    // "Crawled - currently not indexed" for weeks/months because of it.
    '/income',
    '/insurance',
    '/insurance-reviews',
    '/ai-analyst',
    '/robo-advisors',
    '/topics',
    '/search',
    '/taxes',
    '/terms-beginning-with-c',
    '/terms-beginning-with-num',
    '/terms-beginning-with-z',
    '/housing-market-cools-mortgage-rates',
    '/fed-holds-rates-inflation-cooling',
    '/bitcoin-surges-institutional-demand',
    '/tech-stocks-ai-spending-boom',
    '/etf-inflows-record-february',
    '/sp500-record-high-earnings',
    '/gold-hits-2400-safe-haven',
    '/research-ai',
    '/knowledge-map',
  ],
};
