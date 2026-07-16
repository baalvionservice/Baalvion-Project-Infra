/**
 * Resolves the real canonical href for a `NewsArticle`-shaped card. The same
 * shape is used for both dated news (canonical `/YYYY/MM/DD/slug`) and
 * content-engine guides synced in from the CMS (canonical
 * `/<categorySlug>/slug`, e.g. `/bonds/how-bond-yields-work`) — cards must
 * not hardcode a bare `/slug` link, since neither route resolves at that
 * bare path and it 404s once the article is no longer reachable via the
 * legacy bare-slug redirect chain.
 */
export function newsArticleHref(article: { slug: string; publishedAt: string; contentType?: string; categorySlug?: string }): string {
  if (article.contentType === 'article') {
    // A guide's permalink lives under its real CMS category (e.g. /bonds/<slug>)
    // so browsing from /bonds and opening an article stays under /bonds, not a
    // flat /financial-intelligence/ bucket disconnected from the topic hub.
    // Falls back to the legacy bucket only for rows with no category assigned.
    return article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
  }
  return articleUrl(article.publishedAt, article.slug);
}

/**
 * Canonical article URL scheme, matching how wire outlets like CNBC path their
 * own article pages (`/YYYY/MM/DD/slug`) instead of a bare `/slug`.
 */
export function articleUrl(dateISO: string | null | undefined, slug: string): string {
  const parsed = dateISO ? new Date(dateISO) : new Date();
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const yyyy = safe.getUTCFullYear();
  const mm = String(safe.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(safe.getUTCDate()).padStart(2, "0");
  return `/${yyyy}/${mm}/${dd}/${slug}`;
}

export interface LinkableStory {
  slug?: string;
  dateISO?: string;
  href?: string;
}

/**
 * Resolves a World news tile to a clickable destination: an owned article page
 * when we have a slug (CMS/editorial content), an external link when it's wire
 * content with no owned article (Google News fallback), or null when there's
 * nothing to link to yet.
 */
export function storyHref(item: LinkableStory): { href: string; external: boolean } | null {
  if (item.slug) return { href: articleUrl(item.dateISO, item.slug), external: false };
  if (item.href) return { href: item.href, external: true };
  return null;
}
