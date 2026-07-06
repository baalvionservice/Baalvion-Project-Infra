import { Category } from "../types/category";
import { Article } from "../types/article";
import { MOCK_CATEGORIES } from "../models/category";
import { getArticles } from "./content-service";
import { ApiResponse } from "@/types/api";
import { slugify } from "../utils/slugify";

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
 *
 * Real content categories come from the CMS and aren't all present in the
 * static MOCK_CATEGORIES taxonomy, so any slug backed by at least one
 * published article resolves to a synthesized Category rather than 404ing.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<ApiResponse<Category | null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const known = MOCK_CATEGORIES.find((c) => c.slug === slug);
  if (known) {
    return { data: known, status: 200 };
  }

  const articlesResponse = await getArticlesByCategorySlug(slug);
  const [firstArticle] = articlesResponse.data;
  if (!firstArticle) {
    return { data: null, status: 404 };
  }

  return {
    data: {
      id: slug,
      slug,
      name: firstArticle.category,
      description: `Explore our latest intelligence on ${firstArticle.category}.`,
      articleCount: articlesResponse.data.length,
    },
    status: 200,
  };
}

/**
 * Fetches all articles belonging to a specific category slug.
 */
export async function getArticlesByCategorySlug(
  slug: string
): Promise<ApiResponse<Article[]>> {
  const allArticlesResponse = await getArticles(1, 100);

  const targetSlug = slugify(slug);
  const filteredArticles = allArticlesResponse.data.filter(
    (article) => slugify(article.category) === targetSlug
  );

  return {
    data: filteredArticles,
    status: 200,
  };
}
