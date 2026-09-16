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

/**
 * Stock articles to temporarily hide/noindex. Previously listed all 28 pre-trim
 * articles (including every one of the 10 pillar articles kept when the category
 * was curated down from 28 to 10 in the CMS on 2026-09-15) — that made this list
 * hide the exact set of articles the CMS trim was meant to surface. The CMS-level
 * curation is now the source of truth for this category, so nothing further is
 * suppressed here.
 */
export const HIDDEN_STOCK_ARTICLES = new Set<string>([]);

/**
 * Budgeting articles to temporarily hide/noindex. Same history as
 * HIDDEN_STOCK_ARTICLES: previously overlapped 7 of the 10 pillar articles kept
 * when Budgeting Basics was curated down from 37 to 10 in the CMS on 2026-09-15.
 */
export const HIDDEN_BUDGETING_ARTICLES = new Set<string>([]);

/** 3 Thin financial tools consisting primarily of a calculator with little supporting text */
export const HIDDEN_FINANCIAL_TOOLS = new Set<string>([
  '/financial-tools/dividend',
  '/financial-tools/position-size',
  '/financial-tools/profit-loss',
]);

/**
 * Fraud protection articles to temporarily hide/noindex. Previously hid 2 of the
 * category's only 5 live articles; Scams & Fraud Protection is being grown to
 * 8-10 articles, not trimmed, so nothing is suppressed here.
 */
export const HIDDEN_FRAUD_ARTICLES = new Set<string>([]);

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
