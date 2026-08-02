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

// Mirrors developer-service's apiKeyService.publicView() row shape
// (Backend/services/infrastructure/developer-service/services/apiKeyService.js).
export interface ApiKeyRecord {
  id: string;
  org_id: string | null;
  name: string;
  mode: "live" | "test";
  key_prefix: string;
  last4: string;
  scopes: string[];
  status: "active" | "revoked";
  expires_at: string | null;
  rate_limit_per_min: number;
  created_at: string;
  rotated_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  /** Present only in the response body immediately after issue/rotate — shown once. */
  key?: string;
}
