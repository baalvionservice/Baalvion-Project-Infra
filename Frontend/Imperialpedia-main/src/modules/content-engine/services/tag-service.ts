import { Tag } from "../types/tag";
import { Article } from "../types/article";
import { MOCK_TAGS } from "../models/tag";
import { getArticles } from "./content-service";
import { ApiResponse } from "@/types/api";

/**
 * @fileOverview Service layer for managing and retrieving content tags and topics.
 */

/**
 * Fetches all available tags for the topic index.
 */
export async function getTags(): Promise<ApiResponse<Tag[]>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    data: MOCK_TAGS,
    status: 200,
  };
}

/**
 * Fetches a single tag by its slug.
 */
export async function getTagBySlug(
  slug: string
): Promise<ApiResponse<Tag | null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const tag = MOCK_TAGS.find((t) => t.slug === slug) || null;

  return {
    data: tag,
    status: tag ? 200 : 404,
  };
}

/**
 * Fetches all articles belonging to a specific tag slug.
 */
export async function getArticlesByTag(
  slug: string
): Promise<ApiResponse<Article[]>> {
  const allArticlesResponse = await getArticles(1, 100);

  // Filter articles that include this tag in their tags array
  const filteredArticles = allArticlesResponse.data.filter((article) =>
    article.tags.some((tag) => tag.toLowerCase() === slug.toLowerCase())
  );

  return {
    data: filteredArticles,
    status: 200,
  };
}
