/**
 * Shared topic definitions for the Creator Economy section, used by both the
 * static fallback (static-content.ts) and the live-CMS path (cms-public.ts)
 * so the two never drift into filtering articles differently.
 */

export const CREATOR_SLUGS = new Set([
  'creator-economy',
  'youtube-monetization',
  'instagram-monetization',
  'website-monetization',
  'social-media-earnings',
  'creator-guides',
  'creator-tools',
]);

export const CREATOR_SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  'youtube-monetization': ['youtube'],
  'instagram-monetization': ['instagram', 'sponsorship', 'brand-deal'],
  'website-monetization': ['website', 'adsense', 'page-rpm'],
  'social-media-earnings': ['tiktok', 'facebook', 'social', 'instagram'],
  'creator-guides': ['income-stream', 'affiliate', 'digital-product', 'sponsorship', 'business'],
  'creator-tools': ['calculator', 'rpm-vs-cpm', 'adsense-page-rpm', 'tool'],
};

/**
 * Narrows a pool of creator-economy articles down to the ones genuinely on
 * topic for a given subtopic slug. Returns the pool unchanged for the hub
 * itself ("creator-economy") or any slug with no keyword mapping.
 */
export function filterCreatorArticlesByTopic<
  T extends { title: string; slug: string; excerpt?: string; tags?: string[] },
>(articles: T[], topicSlug: string): T[] {
  const keywords = CREATOR_SUBTOPIC_KEYWORDS[topicSlug];
  if (!keywords || keywords.length === 0) return articles;
  return articles.filter((article) => {
    const haystack = `${article.title} ${article.slug} ${article.excerpt ?? ''} ${(article.tags || []).join(' ')}`.toLowerCase();
    return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
  });
}
