import { Category } from "../types/category";
import { Article } from "../types/article";
import { MOCK_CATEGORIES } from "../models/category";
import { getArticles } from "./content-service";
import { ApiResponse } from "@/types/api";

/**
 * @fileOverview Service layer for managing and retrieving content categories.
 */

/**
 * Fetches all available categories.
 */
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    data: MOCK_CATEGORIES,
    status: 200,
  };
}

/**
 * Fetches a single category by its slug.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<ApiResponse<Category | null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const category = MOCK_CATEGORIES.find((c) => c.slug === slug) || null;

  return {
    data: category,
    status: category ? 200 : 404,
  };
}

/**
 * Fetches all articles belonging to a specific category slug.
 */
export async function getArticlesByCategorySlug(
  slug: string
): Promise<ApiResponse<Article[]>> {
  const allArticlesResponse = await getArticles(1, 100);

  // Filter articles based on the category slug (case-insensitive)
  const filteredArticles = allArticlesResponse.data.filter(
    (article) => article.category.toLowerCase() === slug.toLowerCase()
  );

  return {
    data: filteredArticles,
    status: 200,
  };
}
