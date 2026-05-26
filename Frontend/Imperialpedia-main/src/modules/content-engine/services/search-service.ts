import { Article } from "../types";

/**
 * @fileOverview Client-side search service for the Content Engine.
 * Provides basic in-memory indexing and searching capabilities.
 */

/**
 * Performs a simple keyword search across multiple article fields.
 * Matches are weighted towards titles and tags.
 */
export function searchArticles(articles: Article[], query: string): Article[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const searchTerms = normalizedQuery.split(/\s+/);

  return articles.filter((article) => {
    const title = (article.title || "").toLowerCase();
    const description = (article.description || "").toLowerCase();
    const category = (article.category || "").toLowerCase();
    const tags = (article.tags || []).map((t) => t.toLowerCase());

    // Check if every search term appears in at least one of the fields
    return searchTerms.every(
      (term) =>
        title.includes(term) ||
        description.includes(term) ||
        category.includes(term) ||
        tags.some((tag) => tag.includes(term))
    );
  });
}
