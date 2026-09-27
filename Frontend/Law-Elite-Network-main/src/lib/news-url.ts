/**
 * @fileOverview News is a distinct CMS content type from Articles
 * (contentType: 'news' vs 'article' -- see CmsArticle.contentType in cms.ts)
 * and gets a distinct URL shape: a fixed /news/ prefix (required -- see the
 * naming-conflict note below) followed by publish date and geography, not a
 * category. Articles keep their existing /{category}/{slug} shape via
 * article-url.ts; the two are never interchangeable.
 *
 * The prefix is a technical requirement, not a style choice: the app root
 * already has a dynamic [categorySlug] segment (src/app/[categorySlug]),
 * and Next.js requires every dynamic folder at the same route level to
 * share one parameter name -- a bare /[year] sibling would fail to build.
 * A static /news/ segment sidesteps that entirely (static segments coexist
 * fine with a dynamic sibling), which is also how most real news sites
 * structure date-based URLs (e.g. bbc.com/news/{date}/...).
 */

const FALLBACK_GEO_SLUG = 'global';

/** "United States" -> "united-states". No dependency on countries.ts's ISO code list since CmsArticle.country is admin-entered free text, not guaranteed to be a code. */
function slugifyGeo(value?: string | null): string {
  if (!value) return FALLBACK_GEO_SLUG;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || FALLBACK_GEO_SLUG;
}

export interface NewsDateParts {
  year: string;
  month: string;
  day: string;
}

/** Real published date only -- never falls back to "now" (see sitemap.ts's parseRealDate for why that's a fabricated-freshness bug). Returns null when there's no real date to build a URL from. */
export function newsDateParts(publishedAt?: string | null): NewsDateParts | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
  };
}

/**
 * Canonical News URL: /news/{yyyy}/{mm}/{dd}/{country-slug}/{slug}.
 * Returns null when the item has no real published date (never fabricates
 * one) -- a caller with a null result should not link to this item yet.
 */
export function newsUrl(article: {
  slug?: string | null;
  updatedAt?: string | null;
  country?: string | null;
}): string | null {
  const slug = article?.slug;
  if (!slug) return null;
  const parts = newsDateParts(article.updatedAt);
  if (!parts) return null;
  const geo = slugifyGeo(article.country);
  return `/news/${parts.year}/${parts.month}/${parts.day}/${geo}/${slug}`;
}
