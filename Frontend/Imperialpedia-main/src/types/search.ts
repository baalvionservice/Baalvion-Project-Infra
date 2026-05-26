/**
 * @fileOverview Type definitions for the Global Search System.
 */

import { ApiResponse } from "./api";

export type { ApiResponse };

export type SearchResultType =
  | "country"
  | "company"
  | "industry"
  | "technology"
  | "article"
  | "author"
  | "calculator"
  | "glossary"
  | "topic";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  route: string;
  category?: string;
  tags?: string[];
  author?: string;
  date?: string;
  views?: number;
}

export interface SearchSuggestion {
  id: string;
  type: SearchResultType;
  title: string;
  route: string;
}

export interface AdvancedSearchFilters {
  category?: string;
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: "relevance" | "date" | "popularity" | "latest" | "popular";
}

export interface TopicRecommendation {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isTrending: boolean;
  category: string;
}
