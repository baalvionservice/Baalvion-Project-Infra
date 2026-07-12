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

/** Turns a tag slug like "wealth-building" into a display name "Wealth Building". */
function humanizeTagSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetches a single tag by its slug. Curated tags (name/description/SEO copy)
 * come from MOCK_TAGS; any other slug that real articles are actually tagged
 * with is still resolved (derived from the slug) instead of 404ing — tag
 * pages should never break just because a tag wasn't hand-curated.
 */
export async function getTagBySlug(
  slug: string
): Promise<ApiResponse<Tag | null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const curated = MOCK_TAGS.find((t) => t.slug === slug);
  if (curated) {
    return { data: curated, status: 200 };
  }

  const matching = await getArticlesByTag(slug);
  if (matching.data.length === 0) {
    return { data: null, status: 404 };
  }

  const name = humanizeTagSlug(slug);
  const derived: Tag = {
    id: `tag-${slug}`,
    slug,
    name,
    description: `Expert analysis and financial insights related to ${name}.`,
    articleCount: matching.data.length,
  };

  return { data: derived, status: 200 };
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
