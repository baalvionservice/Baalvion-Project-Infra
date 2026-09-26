/**
 * Shared topic definitions for the Creator Economy section, used by both the
 * static fallback (static-content.ts) and the live-CMS path (cms-public.ts)
 * so the two never drift into filtering articles differently.
 *
 * 2026-09-23: consolidated from 6 subtopics to 4 ("creator-guides" merged
 * into "creator-tools", "social-media-earnings" merged into
 * "instagram-monetization" — see next.config.ts) and switched from
 * independent per-subtopic keyword matching to exclusive assignment. The old
 * version ran each subtopic's keyword list against the full 21-article pool
 * on its own, so an article could legitimately satisfy more than one
 * subtopic's keywords at once — "Sponsorship Rate Estimator Tool & Pricing
 * Guide" matched 'sponsorship' (instagram-monetization), 'tool'
 * (creator-tools), and 'business' (creator-guides) simultaneously, so it
 * showed as the featured lead on three different hub pages at once. Now each
 * article is claimed by at most one subtopic, in priority order below, and
 * removed from the pool for every subtopic after it.
 */

export const CREATOR_SLUGS = new Set([
  'creator-economy',
  'youtube-monetization',
  'instagram-monetization',
  'website-monetization',
  'creator-tools',
]);

/**
 * Priority order for exclusive assignment — earlier subtopics claim a
 * matching article first. YouTube and Website are the most narrowly-scoped
 * (their keywords rarely collide with anything else) so they go first;
 * Instagram absorbs the former social-media-earnings keywords next; Creator
 * Tools (which absorbed creator-guides) is the catch-all for business/tool
 * content and goes last so it doesn't steal platform-specific pieces.
 */
const CREATOR_SUBTOPIC_ORDER = [
  'youtube-monetization',
  'website-monetization',
  'instagram-monetization',
  'creator-tools',
] as const;

export const CREATOR_SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  'youtube-monetization': ['youtube'],
  'website-monetization': [
    'website',
    'adsense',
    'page-rpm',
    // display-ad-networks-mediavine-vs-raptive-vs-ezoic
    'mediavine',
    'raptive',
    'ezoic',
  ],
  // Absorbed the former "social-media-earnings" bucket (tiktok/facebook/x)
  // 2026-09-23. 'creator-fund' and 'revenue-sharing' cover the two
  // cross-platform pieces that bucket originally curated (how-platform-
  // creator-funds-calculate-rpm, ad-revenue-sharing-models-and-cpm-trends);
  // 'sponsored-post' / 'contract' / 'invoice' cover this page's own original
  // relatedReading picks (sponsored-post-rate-benchmarks-for-micro-
  // influencers, creator-contract-essentials-and-invoice-payment-terms).
  'instagram-monetization': [
    'instagram',
    'brand-deal',
    'sponsorship',
    'sponsored-post',
    'tiktok',
    'facebook',
    'creator-fund',
    'revenue-sharing',
    'contract',
    'invoice',
  ],
  // Absorbed the former "creator-guides" bucket (tax/LLC/FTC/business)
  // 2026-09-23 — 'tax', 'digital-media-business', 'media-kit', and
  // 'rate-sheet' cover that bucket's own original relatedReading picks;
  // 'payout-comparison-chart' covers this page's own original pick
  // (platform-payout-comparison-chart).
  'creator-tools': [
    'calculator',
    'rpm-vs-cpm',
    'adsense-page-rpm',
    'tool',
    'income-stream',
    'affiliate',
    'digital-product',
    'business',
    'tax',
    'digital-media-business',
    'media-kit',
    'rate-sheet',
    'payout-comparison-chart',
  ],
};

/**
 * Narrows a pool of creator-economy articles down to the ones assigned to a
 * given subtopic slug, with each article claimed by exactly one subtopic
 * (see CREATOR_SUBTOPIC_ORDER above) so the same piece can never appear as
 * the lead/feed item on two different hub pages. Returns the pool unchanged
 * for the hub itself ("creator-economy") or any slug with no keyword mapping.
 */
export function filterCreatorArticlesByTopic<
  T extends { title: string; slug: string; excerpt?: string; tags?: string[] },
>(articles: T[], topicSlug: string): T[] {
  if (!CREATOR_SUBTOPIC_ORDER.includes(topicSlug as (typeof CREATOR_SUBTOPIC_ORDER)[number])) {
    return articles;
  }

  const claimed = new Set<string>();
  const result: T[] = [];

  for (const subtopic of CREATOR_SUBTOPIC_ORDER) {
    const keywords = CREATOR_SUBTOPIC_KEYWORDS[subtopic] ?? [];
    for (const article of articles) {
      if (claimed.has(article.slug)) continue;
      const haystack = `${article.title} ${article.slug} ${article.excerpt ?? ''} ${(article.tags || []).join(' ')}`.toLowerCase();
      if (keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
        claimed.add(article.slug);
        if (subtopic === topicSlug) result.push(article);
      }
    }
  }

  return result;
}
