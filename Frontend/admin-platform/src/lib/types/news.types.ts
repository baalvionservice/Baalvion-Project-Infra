export type NewsSourceType = 'rss' | 'press_release' | 'government';
export type NewsCategory =
  | 'AI'
  | 'Technology'
  | 'Business'
  | 'Finance'
  | 'Startups'
  | 'Cybersecurity'
  | 'World'
  | 'Science';
export type NewsSentiment = 'positive' | 'neutral' | 'negative';

export interface NewsSource {
  id: string;
  name: string;
  type: NewsSourceType;
  feed_url: string;
  country: string | null;
  language: string;
  default_category: NewsCategory;
  is_active: boolean;
  poll_interval_minutes: number;
  last_polled_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  summary_raw: string | null;
  summary_ai: string | null;
  published_at: string;
  country: string | null;
  language: string;
  category: NewsCategory;
  sentiment: NewsSentiment | null;
  source: { id: string; name: string; type: NewsSourceType };
}

export interface PaginatedNewsArticles {
  items: NewsArticle[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NewsStatsOverview {
  totalArticles: number;
  articlesLast24h: number;
  totalSources: number;
  activeSources: number;
  lastIngestedAt: string | null;
  byCategory: Array<{ category: string; count: number }>;
}

export interface NewsTrendingItem {
  value: string | null;
  count: number;
  priorCount: number;
  changePct: number | null;
}
