/**
 * Thin/duplicate articles permanently killed in the 2026-08 SEO cleanup pass
 * (see REMOVED_PATHS in middleware.ts, which 410s these at the edge). Single
 * source of truth for every other place that reads articles straight from the
 * CMS and must not resurface one of these rows — sitemap generation and the
 * homepage editorial picker (getHomeEditorial.ts) both import this instead of
 * keeping their own copy, so a still-published CMS row for one of these slugs
 * can never leak into a sitemap entry or a homepage card that then 410s on
 * click. Matched by full path since the 3 dollar-cost-averaging duplicates
 * live under different categorySlugs (stocks/investing/personal-finance), not
 * financial-intelligence.
 */
export const REMOVED_ARTICLE_PATHS = new Set<string>([
  "/stocks/dollarcost-averaging-explained",
  "/investing/what-is-dollarcost-averaging",
  "/personal-finance/dollar-cost-averaging",
  "/financial-intelligence/money-management-for-students",
  "/financial-intelligence/best-money-habits-of-millionaires",
  "/financial-intelligence/debt-snowball-vs-debt-avalanche",
  "/financial-intelligence/smart-spending-habits",
  "/financial-intelligence/passive-income-ideas",
  "/financial-intelligence/side-hustles-for-beginners",
  "/financial-intelligence/family-financial-planning",
  "/financial-intelligence/how-inflation-affects-your-savings",
  "/financial-intelligence/how-much-savings-should-you-have",
  "/financial-intelligence/how-to-track-expenses",
  "/financial-intelligence/best-personal-finance-apps",
  "/financial-intelligence/financial-independence-guide",
  "/financial-intelligence/what-is-market-capitalization",
  "/financial-intelligence/what-is-dollar-cost-averaging",
  "/financial-intelligence/personal-net-worth-calculator-guide",
  "/financial-intelligence/how-to-start-investing-in-stocks",
  "/financial-intelligence/how-to-invest-during-a-recession",
  "/financial-intelligence/how-to-improve-financial-discipline",
  "/financial-intelligence/how-to-create-a-monthly-budget",
  "/financial-intelligence/how-to-buy-stocks-online",
  "/financial-intelligence/how-to-build-wealth-from-scratch",
  "/financial-intelligence/how-to-build-a-stock-portfolio",
  "/financial-intelligence/how-to-analyze-a-stock",
  "/financial-intelligence/how-often-should-you-rebalance-your-portfolio",
  "/financial-intelligence/how-much-money-do-you-need-to-start-investing",
  "/financial-intelligence/growth-stocks-vs-value-stocks",
  "/financial-intelligence/financial-goals-framework",
  "/financial-intelligence/dividend-stocks-for-passive-income",
  "/financial-intelligence/common-stock-investing-mistakes",
  "/financial-intelligence/common-money-mistakes",
  "/financial-intelligence/best-stocks-for-beginners",
  "/financial-intelligence/best-long-term-stocks",
  "/financial-intelligence/50-30-20-budget-rule-explained",
]);

/**
 * True when a CMS article's real canonical path (matching newsArticleHref's
 * `/<categorySlug>/<slug>` scheme for contentType "article") is one of the
 * permanently-removed duplicates above.
 */
export function isRemovedArticlePath(article: { slug: string; categorySlug?: string }): boolean {
  const path = article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
  return REMOVED_ARTICLE_PATHS.has(path);
}
