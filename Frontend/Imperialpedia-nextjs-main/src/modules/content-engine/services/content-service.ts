/**
 * @fileOverview Content Service Layer for the Imperialpedia Content Engine.
 * Handles fetching, loading, and managing article data with proper model transformation.
 */

import { articlesService } from "@/services/data";
import { Article, ArticleStatus } from "../types";
import { ApiResponse, PaginatedResponse } from "@/types";

/**
 * Transforms raw article data from the mock API into the internal Article model.
 * This ensures consistency across the content engine regardless of the data source.
 */
function mapToArticleModel(raw: any): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description || raw.excerpt || "",
    authorId: raw.authorId || "unknown",
    authorName: raw.authorName,
    authorSlug: raw.authorSlug,
    reviewerSlug: raw.reviewerSlug,
    reviewedAt: raw.reviewedAt,
    factCheckerSlug: raw.factCheckerSlug,
    factCheckedAt: raw.factCheckedAt,
    citations: raw.citations,
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt || raw.publishedAt || new Date().toISOString(),
    category: raw.category || "General",
    categorySlug: raw.categorySlug,
    contentType: raw.contentType,
    videoUrl: raw.videoUrl || undefined,
    tags: raw.tags || [],
    status: (raw.status as ArticleStatus) || "published",
    readingTime: raw.meta?.readingTime || raw.readingTime || 0,
    featuredImage: raw.featuredImage || "",
    seoTitle: raw.seoTitle || raw.title,
    seoDescription: raw.seoDescription || raw.description || raw.excerpt,
    seoKeywords: raw.seoKeywords || raw.tags || [],
  };
}

/**
 * Fetches a paginated list of articles.
 */
export async function getArticles(
  page?: number,
  limit?: number
): Promise<PaginatedResponse<Article>> {
  const response = await articlesService.getArticles(page, limit);

  return {
    ...response,
    data: response.data.map(mapToArticleModel),
  };
}

/**
 * Fetches every published article attributed to an author profile (by slug).
 */
export async function getArticlesByAuthor(
  authorSlug: string,
  page?: number,
  limit?: number
): Promise<PaginatedResponse<Article>> {
  const response = await articlesService.getArticlesByAuthor(authorSlug, page, limit);

  return {
    ...response,
    data: response.data.map(mapToArticleModel),
  };
}

/**
 * Fetches a single article by its unique slug.
 */
export async function getArticleBySlug(
  slug: string
): Promise<ApiResponse<Article | null>> {
  const response = await articlesService.getArticleBySlug(slug);

  return {
    ...response,
    data: response.data ? mapToArticleModel(response.data) : null,
  };
}

/**
 * Fetches articles belonging to a specific financial category.
 */
export async function getArticlesByCategory(
  category: string
): Promise<ApiResponse<Article[]>> {
  const response = await articlesService.getArticles(1, 100);
  const filtered = response.data
    .filter(
      (article) => article.category.toLowerCase() === category.toLowerCase()
    )
    .map(mapToArticleModel);

  return {
    data: filtered,
    status: 200,
  };
}

// Ceiling on how many topic matches the Related Articles box shows — a whole
// category can run to 80+ articles, which is more a dumped category listing
// than a "related" box, so the top-scored (most relevant) 16 are shown.
const MAX_RELATED_ARTICLES = 16;

/**
 * Fetches articles related to the given one by topic — same category
 * (server-filtered by categorySlug, so it's the *whole* category rather than
 * whatever happens to be in the 100 most-recent articles site-wide) plus
 * shared tags, ranked by relevance, capped at MAX_RELATED_ARTICLES. Falls
 * back to a short plain most-recent list only when this article has no
 * category/tags to match on at all.
 */
export async function getRelatedArticles(
  articleId: string,
  category?: string,
  tags?: string[],
  categorySlug?: string
): Promise<ApiResponse<Article[]>> {
  const [categoryPool, recentPool] = await Promise.all([
    categorySlug ? articlesService.getArticlesByCategorySlug(categorySlug, 100) : Promise.resolve({ data: [] }),
    articlesService.getArticles(1, 100),
  ]);

  const seen = new Set<string>([articleId]);
  const candidates = [...categoryPool.data, ...recentPool.data].filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });

  const normalizedTags = new Set((tags ?? []).map((t) => t.toLowerCase()));
  const scored = candidates
    .map((article) => {
      const sharedTags = (article.tags ?? []).filter((t: string) => normalizedTags.has(t.toLowerCase())).length;
      const sameCategory = category ? article.category === category : false;
      return { article, score: (sameCategory ? 2 : 0) + sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  // No topic signal at all (no category/tags matched anything) — a short
  // recency fallback so the section isn't empty, not the whole 100-article pool.
  const related = scored.length > 0 ? scored.map((entry) => entry.article) : candidates.slice(0, 4);
  const mapped = related.slice(0, MAX_RELATED_ARTICLES).map(mapToArticleModel);

  return {
    data: mapped,
    status: 200,
  };
}
