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
  "indicators",
  "inflation",
  "interest-rates",
  "investing",
  "live-market-news",
  "loan-reviews",
  "loans",
  "monetary-policy",
  "money-management",
  "money-market",
  "monthly-budget",
  "mortgages",
  "mutual-funds",
  "options",
  "personal-finance",
  "planning",
  "portfolio",
  "real-estate",
  "retirement",
  "saving-money",
  "savings",
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
  [/^\/markets(?=\/|$)/, "/market-news"],
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
