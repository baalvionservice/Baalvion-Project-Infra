export type Sentiment = "positive" | "neutral" | "negative";

export interface RealArticle {
  id: string;
  title: string;
  url: string;
  summary_raw: string | null;
  summary_ai: string | null;
  published_at: string;
  country: string | null;
  language: string;
  category: string;
  sentiment: Sentiment | null;
  entities: string[] | null;
  source: { id: string; name: string; type: string };
}

export interface PaginatedArticles {
  items: RealArticle[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatsOverview {
  totalArticles: number;
  articlesLast24h: number;
  totalSources: number;
  activeSources: number;
  lastIngestedAt: string | null;
  byCategory: Array<{ category: string; count: number }>;
}

export interface TrendingItem {
  value: string | null;
  count: number;
  priorCount: number;
  changePct: number | null;
}

export interface TrendingResponse {
  dimension: "category" | "country" | "source";
  windowHours: number;
  items: TrendingItem[];
}
