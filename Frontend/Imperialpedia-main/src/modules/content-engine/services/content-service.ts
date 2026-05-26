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
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt || raw.publishedAt || new Date().toISOString(),
    category: raw.category || "General",
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

/**
 * Fetches a list of articles related to the given article.
 * Logic: Same category, excluding the current article.
 */
export async function getRelatedArticles(
  articleId: string,
  category?: string
): Promise<ApiResponse<Article[]>> {
  const response = await articlesService.getArticles(1, 50);

  let related = response.data.filter((article) => article.id !== articleId);

  if (category) {
    const sameCategory = related.filter((a) => a.category === category);
    if (sameCategory.length > 0) {
      related = sameCategory;
    }
  }

  const mapped = related.slice(0, 3).map(mapToArticleModel);

  return {
    data: mapped,
    status: 200,
  };
}
