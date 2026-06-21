/**
 * Baked Personal Finance content (committed snapshot) — the always-on source that
 * lets the site render its content with NO external CMS (e.g. on Vercel, where the
 * local cms-service is unreachable). A live CMS still takes precedence at request
 * time; this is only used as the fallback.
 *
 * IMPORTANT: import this module ONLY from Server Components / server-side code.
 * It statically imports a ~750 KB JSON snapshot; pulling it into a Client Component
 * would bloat the browser bundle. (`server-only` isn't a dependency here, so this is
 * enforced by convention — keep the importers server-side.)
 *
 * Regenerate after editing content specs:  node scripts/generate-static-content.cjs
 */
import raw from '@/generated/personal-finance-content.json';
import {
  type CmsContent,
  type CmsPage,
  cmsContentToArticle,
  cmsContentToNews,
  blocksToHtml,
} from './cms-public';
import type { Article } from '@/modules/content-engine/types/article';
import type { NewsArticle } from '@/lib/data.news';

const ALL = raw as unknown as CmsContent[];
const ARTICLES = ALL.filter((c) => c.contentType === 'article');
const PAGES = ALL.filter((c) => c.contentType === 'page');

/** All baked articles as Article models (live-CMS-identical shape). */
export function staticArticleList(): Article[] {
  return ARTICLES.map(cmsContentToArticle);
}

/** A single baked article by slug, or null if not in the snapshot. */
export function staticArticleBySlug(slug: string): Article | null {
  const c = ARTICLES.find((a) => a.slug === slug);
  return c ? cmsContentToArticle(c) : null;
}

/**
 * A single baked article by slug as a NewsArticle card/detail, or null if not in
 * the snapshot. Used by the canonical root `/[slug]` article route so real CMS
 * articles stay reachable when the live CMS is offline (e.g. on Vercel) — mirrors
 * the hybrid fallback already used by `/articles/[slug]` and the topic feeds.
 */
export function staticNewsBySlug(slug: string): NewsArticle | null {
  const c = ARTICLES.find((a) => a.slug === slug);
  return c ? cmsContentToNews(c) : null;
}

/**
 * Baked articles for a category, as NewsArticle cards (for topic/hub pages).
 * Every baked article lives in the `personal-finance` category, so only that slug
 * (or no slug) returns content.
 */
export function staticCategoryNews(categorySlug?: string): NewsArticle[] {
  if (categorySlug && categorySlug !== 'personal-finance') return [];
  return ARTICLES.map(cmsContentToNews);
}

/** A baked CMS page (About / Contact / Privacy) by slug, or null. */
export function staticPageBySlug(slug: string): CmsPage | null {
  const c = PAGES.find((p) => p.slug === slug);
  if (!c) return null;
  const bodyHtml = blocksToHtml(c.contentBlocks);
  if (!bodyHtml) return null;
  return {
    title: c.title,
    bodyHtml,
    seoTitle: c.seoMetadata?.title || c.title,
    seoDescription: c.seoMetadata?.description || c.excerpt || '',
    seoKeywords: c.seoMetadata?.keywords || [],
    updatedAt: c.updatedAt,
  };
}
