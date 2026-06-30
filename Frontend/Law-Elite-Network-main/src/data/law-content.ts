/**
 * @fileOverview Law Elite Network — bundled editorial content library (Phase 1).
 *
 * This is the trustworthy, network-independent baseline for the public
 * knowledge site. The live law-service / CMS API takes precedence when it
 * returns data; when it is empty or unreachable, these professionally written
 * explainer articles render so the site is never blank for readers or crawlers.
 *
 * All articles are general legal education for a worldwide audience — they are
 * NOT jurisdiction-specific legal advice (every piece carries that disclaimer).
 */

export interface LawTaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

export interface LawArticle {
  id: string;
  title: string;
  slug: string;
  /** First letter (uppercase) — powers the A–Z lexicon filter. */
  alphabet: string;
  categoryId: string;
  subcategoryId: string;
  /** Denormalized refs so breadcrumbs/series render without an API round-trip. */
  category: LawTaxonomyRef;
  subcategory: LawTaxonomyRef;
  summary: string;
  /** Sanitized editorial HTML (h2/h3, lists, .key-takeaways block). */
  content: string;
  author: string;
  /** Human-readable publish/update date, e.g. "June 18, 2026". */
  updatedAt: string;
  /** Estimated reading time in minutes. */
  readingTime: number;
  views: number;
  featured: boolean;
  /** Stable seed for the deterministic editorial image. */
  imageSeed: string;
}

import { LAW_ARTICLES } from './articles';

export function getAllArticles(): LawArticle[] {
  return LAW_ARTICLES;
}

export function getArticleBySlug(slug: string): LawArticle | null {
  return LAW_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function getArticlesByCategorySlug(categorySlug: string): LawArticle[] {
  return LAW_ARTICLES.filter((a) => a.category.slug === categorySlug);
}

export function getArticlesByCategoryId(categoryId: string): LawArticle[] {
  return LAW_ARTICLES.filter((a) => a.categoryId === categoryId);
}

export function getTrendingArticles(limit = 6): LawArticle[] {
  return [...LAW_ARTICLES].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function getFeaturedArticles(limit = 4): LawArticle[] {
  const featured = LAW_ARTICLES.filter((a) => a.featured);
  const pool = featured.length >= limit ? featured : LAW_ARTICLES;
  return [...pool].sort((a, b) => b.views - a.views).slice(0, limit);
}

/**
 * Merge API results over the bundled baseline by slug. API wins; bundled
 * articles fill any gap so a sparse backend still yields a full-looking site.
 */
export function mergeArticles(apiArticles: unknown[] | undefined | null): LawArticle[] {
  const api = Array.isArray(apiArticles) ? (apiArticles as LawArticle[]) : [];
  if (api.length === 0) return getAllArticles();
  const seen = new Set(api.map((a) => a?.slug).filter(Boolean));
  return [...api, ...LAW_ARTICLES.filter((a) => !seen.has(a.slug))];
}
