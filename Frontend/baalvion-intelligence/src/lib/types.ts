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
  entities: Array<{ name: string; count: number }> | null;
  source: { id: string; name: string; type: string };
}

// Mirrors newsController.getEntities() (Backend/services/knowledge/news-service) — real
// frequency ranking over recently ingested articles' extracted entities.
export interface EntitiesResponse {
  windowHours: number;
  items: Array<{ name: string; count: number; lastMentionedAt: string }>;
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

// Mirrors developer-service's alertRuleService.publicView() shape
// (Backend/services/infrastructure/developer-service/services/alertRuleService.js).
export interface AlertRuleRecord {
  id: string;
  org_id: string;
  label: string;
  condition_type: "keyword" | "category" | "country" | "sentiment" | "entity";
  condition_value: string;
  webhook_url: string;
  active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

// Mirrors developer-service's usageService.getUsageForOrg() shape
// (Backend/services/infrastructure/developer-service/services/usageService.js) — real
// counts read from news-service's Redis quota counters, not mocked.
export interface UsageReport {
  month: string;
  redisAvailable: boolean;
  keys: Array<{
    keyId: string;
    name: string;
    mode: "live" | "test";
    last4: string;
    scopes: string[];
    usedToday: number;
    monthToDate: number;
  }>;
  totalMonthToDate: number;
  totalToday: number;
  dailySeries: Array<{ day: string; requests: number }>;
}
