/**
 * @fileOverview Temporary AdSense Cleanup Mode Configuration & Utility Functions.
 *
 * Designed to temporarily clean up Imperialpedia's publicly indexable content and site structure
 * before submitting/re-submitting the site for Google AdSense approval.
 *
 * IMPORTANT: This is a temporary cleanup. Do NOT permanently delete existing articles, authors,
 * categories, tools, or content. Everything is 100% reversible via `ADSENSE_CLEANUP_MODE`.
 *
 * When `ADSENSE_CLEANUP_MODE = true`:
 *  - Temporarily sets <meta name="robots" content="noindex, follow" /> on weak, generic, thin, or non-core URLs.
 *  - Temporarily excludes hidden URLs from the XML sitemap.
 *  - Temporarily removes hidden URLs from header/footer navigation, author listings, and category feeds.
 *
 * When `ADSENSE_CLEANUP_MODE = false`:
 *  - Restores 100% of original site structure, navigation links, author profiles, and indexable metadata.
 */

/** Master toggle switch for AdSense cleanup mode */
export const ADSENSE_CLEANUP_MODE = true;

/** Verified, genuine Imperialpedia author profile slugs */
export const VERIFIED_AUTHOR_SLUGS = new Set<string>([
  'nathan-reiff',
  'julius-mansa',
  'yarilet-perez',
  'allen-krewzz',
  'tamanna-shaikh',
  'deepak-kuldeep',
]);

/** 28 Weaker or generic stock-definition articles to temporarily hide/noindex */
export const HIDDEN_STOCK_ARTICLES = new Set<string>([
  '/stocks/stock-market-circuit-breakers',
  '/stocks/stock-market-trading-hours',
  '/stocks/dividend-yield-explained',
  '/stocks/roa-explained',
  '/stocks/small-cap-stocks-explained',
  '/stocks/outstanding-shares-explained',
  '/stocks/bollinger-bands-explained',
  '/stocks/what-is-an-order-book',
  '/stocks/roe-explained',
  '/stocks/macd-explained',
  '/stocks/rsi-explained',
  '/stocks/free-cash-flow-explained',
  '/stocks/bid-vs-ask-price',
  '/stocks/public-vs-private-companies',
  '/stocks/net-income-explained',
  '/stocks/revenue-explained',
  '/stocks/penny-stocks-explained',
  '/stocks/nasdaq-explained',
  '/stocks/eps-explained',
  '/stocks/price-to-book-ratio-explained',
  '/stocks/nyse-explained',
  '/stocks/price-to-earnings-ratio-explained',
  '/stocks/how-stock-exchanges-work',
  '/stocks/what-is-the-stock-market',
  '/stocks/what-is-a-stock',
  '/stocks/how-to-sell-stocks',
  '/stocks/enterprise-value-explained',
  '/stocks/what-is-market-capitalization',
]);

/** 31 Thin, repetitive, or substantially overlapping budgeting articles to temporarily hide/noindex */
export const HIDDEN_BUDGETING_ARTICLES = new Set<string>([
  '/budgeting-basics/annual-budget-planning-guide',
  '/budgeting-basics/budgeting-during-inflation',
  '/budgeting-basics/budgeting-for-small-business-owners',
  '/budgeting-basics/budgeting-for-freelancers',
  '/budgeting-basics/advanced-budgeting-strategies',
  '/budgeting-basics/manual-budgeting-without-apps',
  '/budgeting-basics/best-budget-apps',
  '/budgeting-basics/when-to-use-emergency-savings',
  '/budgeting-basics/emergency-fund-calculator-guide',
  '/budgeting-basics/managing-student-expenses',
  '/budgeting-basics/budgeting-on-a-part-time-income',
  '/budgeting-basics/college-budget-guide',
  '/budgeting-basics/couples-budgeting',
  '/budgeting-basics/single-parent-budget',
  '/budgeting-basics/budgeting-with-kids',
  '/budgeting-basics/family-budget-guide',
  '/budgeting-basics/frugal-living-tips',
  '/budgeting-basics/lower-utility-bills',
  '/budgeting-basics/reduce-grocery-costs',
  '/budgeting-basics/best-ways-to-cut-expenses',
  '/budgeting-basics/how-to-save-more-every-month',
  '/budgeting-basics/reverse-budgeting-explained',
  '/budgeting-basics/pay-yourself-first-method',
  '/budgeting-basics/budget-methods-compared',
  '/budgeting-basics/budget-review-checklist',
  '/budgeting-basics/budget-calendar-guide',
  '/budgeting-basics/monthly-budget-checklist',
  '/budgeting-basics/common-budgeting-mistakes',
  '/budgeting-basics/why-budgeting-matters',
  '/budgeting-basics/what-is-a-budget',
  '/budgeting-basics/budgeting-after-a-major-life-change',
]);

/** 3 Thin financial tools consisting primarily of a calculator with little supporting text */
export const HIDDEN_FINANCIAL_TOOLS = new Set<string>([
  '/financial-tools/dividend',
  '/financial-tools/position-size',
  '/financial-tools/profit-loss',
]);

/** 2 Thin/weak fraud protection articles */
export const HIDDEN_FRAUD_ARTICLES = new Set<string>([
  '/fraud-protection/tracking-cookies-scam-targeting',
  '/fraud-protection/fake-bank-documents-canva-scams',
]);

/** Dated news articles to temporarily hide/noindex */
export const HIDDEN_NEWS_ARTICLES = new Set<string>([
  '/2026/09/01/modi-calls-for-end-to-ukraine-war-russian-oil-pressure',
  '/2026/08/31/september-fed-rate-hike-warsh-markets-investors',
]);

/**
 * Returns true if an author slug is an unverified/imported profile that should be
 * hidden during AdSense cleanup mode.
 */
export function isAuthorHiddenInCleanupMode(slug: string): boolean {
  if (!ADSENSE_CLEANUP_MODE) return false;
  return !VERIFIED_AUTHOR_SLUGS.has(slug);
}

/**
 * Normalizes an internal href/URL path by stripping trailing slashes, protocol, and host.
 */

function normalizePath(href: string): string {
  if (!href) return '';
  let path = href;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      path = new URL(path).pathname;
    } catch {
      // fallback if URL parsing fails
    }
  }
  path = path.split('?')[0].split('#')[0];
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

/**
 * Evaluates whether a given URL path should be temporarily hidden & noindexed
 * under `ADSENSE_CLEANUP_MODE`.
 */
export function isPathHiddenByAdsenseCleanup(href: string): boolean {
  if (!ADSENSE_CLEANUP_MODE) return false;
  const path = normalizePath(href);
  if (!path) return false;

  // 1. World & geopolitical news section
  if (path === '/world' || path.startsWith('/world/')) {
    return true;
  }

  // 2. Dated news articles
  if (HIDDEN_NEWS_ARTICLES.has(path) || /^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) {
    return true;
  }

  // 3. Unverified author profiles (/authors/* except verified authors)
  if (path.startsWith('/authors/')) {
    const slug = path.replace('/authors/', '');
    if (!VERIFIED_AUTHOR_SLUGS.has(slug)) {
      return true;
    }
  }

  // 4. Weak/generic stock definition articles
  if (HIDDEN_STOCK_ARTICLES.has(path)) {
    return true;
  }

  // 5. Thin/overlapping budgeting articles
  if (HIDDEN_BUDGETING_ARTICLES.has(path)) {
    return true;
  }

  // 6. Thin financial tools
  if (HIDDEN_FINANCIAL_TOOLS.has(path)) {
    return true;
  }

  // 7. Thin fraud protection articles
  if (HIDDEN_FRAUD_ARTICLES.has(path)) {
    return true;
  }

  return false;
}

/** Filter items array by stripping any item whose href is hidden under AdSense cleanup mode */
export function withoutAdsenseHidden<T extends { href?: string; loc?: string }>(items: readonly T[]): T[] {
  if (!ADSENSE_CLEANUP_MODE) return [...items];
  return items.filter((item) => {
    const target = item.href || item.loc;
    return !target || !isPathHiddenByAdsenseCleanup(target);
  });
}
