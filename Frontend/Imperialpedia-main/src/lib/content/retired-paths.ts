/**
 * Top-level category slugs retired pending AdSense approval, mirroring the
 * permanent-redirect block in next.config.ts (each `/<slug>` and
 * `/<slug>/:path*` 301s to `/`).
 *
 * A redirect fixes the destination but nothing updates the links pointing at
 * it, so every retirement pass has left behind nav items, footer columns and
 * homepage cards that bounce a reader back to the homepage. This is the single
 * source of truth those surfaces filter against instead of each keeping its own
 * hand-maintained copy. Keep in sync with next.config.ts — retired-paths.test.ts
 * fails if the two drift.
 *
 * This list is redirect-based retirements ONLY. A page with nothing to
 * redirect to (no live equivalent worth sending a reader or crawler toward)
 * is 410'd instead — see REMOVED_PATHS in middleware.ts — and does not belong
 * here; those pages are removed from nav/footer/sitemap by hand at the same
 * time they're added to REMOVED_PATHS; rather than through this filter.
 */
export const RETIRED_TOP_LEVEL_SLUGS: readonly string[] = [
  "advanced-budgeting",
  "app-reviews",
  "auto-loans",
  "banking",
  "banking-reviews",
  "bonds",
  "brokers",
  "budget-rules",
  "budgeting-apps",
  "calendar",
  "cd-rates",
  "checking",
  "commodities",
  "credit",
  "credit-cards",
  "crypto",
  "cryptocurrency",
  "debt",
  "earnings",
  "economy",
  "emergency-fund",
  "etfs",
  "family-budget",
  "fed",
  "financial-calculators",
  "financial-independence",
  "fiscal-policy",
  "gdp",
  "global",
  "government",
  "indicators",
  "inflation",
  "interest-rates",
  "live-market-news",
  "loan-reviews",
  "loans",
  "market-news",
  "markets",
  "monetary-policy",
  "money-management",
  "money-market",
  "monthly-budget",
  "mortgages",
  "mutual-funds",
  "options",
  "planning",
  "politics",
  "portfolio",
  "real-estate",
  "retirement",
  "saving-money",
  "student-budget",
  "student-loans",
  "tax-software",
  "unemployment",
];

const RETIRED_SLUG_SET = new Set(RETIRED_TOP_LEVEL_SLUGS);

/**
 * Individually retired paths that aren't a whole top-level slug — calculators
 * pulled from `/financial-tools`, and the `/premium` upsell, which bounces an
 * anonymous reader (a review crawler included) into a sign-in wall.
 */
export const RETIRED_EXACT_PATHS = new Set<string>([
  "/financial-tools/portfolio",
  "/financial-tools/retirement",
  "/premium",
]);

/**
 * True if `href` now 301s to `/` (or a sign-in wall) rather than resolving.
 * Accepts any internal href — query strings and hashes are ignored, external
 * URLs are always false.
 */
export function isRetiredPath(href: string): boolean {
  if (!href.startsWith("/")) return false;
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (RETIRED_EXACT_PATHS.has(path)) return true;
  const [, first] = path.split("/");
  return first ? RETIRED_SLUG_SET.has(first) : false;
}

/** Drop every entry whose href is retired. Keeps link lists honest at render time. */
export function withoutRetired<T extends { href: string }>(items: readonly T[]): T[] {
  return items.filter((item) => !isRetiredPath(item.href));
}

/**
 * Internal paths that still resolve but only via a permanent redirect. Hand-
 * authored CMS prose accumulates these — /about links four guides as
 * `/articles/<slug>`, which 301s to `/financial-intelligence/<slug>` — and an
 * internal link into a redirect wastes a hop for the reader and is reported as
 * one by Search Console. Mirrors the corresponding rules in next.config.ts.
 */
const CANONICAL_PREFIX_REWRITES: ReadonlyArray<[RegExp, string]> = [
  [/^\/articles\/(?=.)/, "/financial-intelligence/"],
  [/^\/budgeting(?=\/|$)/, "/budgeting-basics"],
  [/^\/scams-and-fraud-protection(?=\/|$)/, "/fraud-protection"],
  // 2026-09-23: Creator Economy consolidation — "Creator Business Guides" and
  // "Creator Tools & Calculators" were two thin, overlapping category buckets
  // slicing the same 21-article pool (see creator-economy-topics.ts); merged
  // into one "Creator Business & Tools" page at the surviving /creator-tools
  // slug. Content isn't retired, just consolidated — same treatment as
  // /budgeting above.
  [/^\/creator-guides(?=\/|$)/, "/creator-tools"],
  // "Social Media Earnings" (TikTok/Facebook/X) folded into Instagram
  // Monetization for the same reason — same pool, overlapping keywords, not
  // enough genuinely distinct articles to stand alone.
  [/^\/social-media-earnings(?=\/|$)/, "/instagram-monetization"],
];

/**
 * Rewrites an internal href to the destination it would redirect to. Returns
 * the href unchanged when it already points at its canonical location, and
 * never touches external URLs.
 */
export function canonicalizeInternalHref(href: string): string {
  if (!href.startsWith("/")) return href;
  for (const [pattern, replacement] of CANONICAL_PREFIX_REWRITES) {
    if (pattern.test(href)) return href.replace(pattern, replacement);
  }
  return href;
}
