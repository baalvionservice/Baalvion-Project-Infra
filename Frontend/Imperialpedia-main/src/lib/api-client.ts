/**
 * Imperialpedia API Client
 * Typed modules for every imperialpedia-service domain (:3004/api).
 * Handles auth token attachment and transparent 401 refresh.
 */

import authClient from './auth-client';

const IMPERIALPEDIA_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  pagination?: PaginationMeta;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  description?: string;
  body?: string;
  category: string;
  tags: string[];
  authorId: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  featuredImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  readingTime?: number;
}

export interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  title?: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  category?: string;
  specialties?: string[];
  stats: {
    followersCount: number;
    articlesCount: number;
    totalViews: number;
    engagementScore?: number;
  };
}

export interface CreatorDashboardStats {
  creatorId: string;
  totalFollowers: number;
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalRevenue: number;
  performanceTrends: Array<{ date: string; reach: number; engagement: number }>;
}

export interface ModerationItem {
  id: string;
  title: string;
  author: string;
  type: string;
  reportType: string;
  status: string;
  date: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  type: 'article' | 'creator' | 'term';
  title: string;
  slug: string;
  description?: string;
  category?: string;
  score: number;
}

export interface AnalyticsOverview {
  totalViews: number;
  avgEngagement: number;
  totalArticles: number;
  topArticles: Array<{
    articleId: string;
    title: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    seoScore?: number;
    category: string;
  }>;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
}

// ─── Core fetcher with auth + 401 refresh ────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await authClient.getValidToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${IMPERIALPEDIA_URL}${path}`, {
    ...options,
    headers,
  });

  // If we hit a 401 despite the refresh above, clear session and throw
  if (res.status === 401) {
    await authClient.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── articleApi ───────────────────────────────────────────────────────────────

export const articleApi = {
  list(params?: { page?: number; limit?: number; category?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    if (params?.status) qs.set('status', params.status);
    return apiFetch<ApiResponse<Article[]>>(`/articles?${qs.toString()}`);
  },

  getBySlug(slug: string) {
    return apiFetch<ApiResponse<Article>>(`/articles/${slug}`);
  },

  create(payload: Partial<Article>) {
    return apiFetch<ApiResponse<Article>>('/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: Partial<Article>) {
    return apiFetch<ApiResponse<Article>>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete(id: string) {
    return apiFetch<ApiResponse<null>>(`/articles/${id}`, { method: 'DELETE' });
  },
};

// ─── creatorApi ───────────────────────────────────────────────────────────────

export const creatorApi = {
  getProfile(creatorId: string) {
    return apiFetch<ApiResponse<CreatorProfile>>(`/creators/${creatorId}`);
  },

  getDashboardStats(creatorId: string) {
    return apiFetch<ApiResponse<CreatorDashboardStats>>(`/creators/${creatorId}/stats`);
  },

  getContent(creatorId: string, params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch<ApiResponse<Article[]>>(`/creators/${creatorId}/content?${qs.toString()}`);
  },

  list(params?: { page?: number; limit?: number; category?: string; region?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    if (params?.region) qs.set('region', params.region);
    return apiFetch<ApiResponse<CreatorProfile[]>>(`/creators?${qs.toString()}`);
  },
};

// ─── adminApi ─────────────────────────────────────────────────────────────────

export const adminApi = {
  getModerationQueue() {
    return apiFetch<ApiResponse<ModerationItem[]>>('/admin/moderation');
  },

  moderateContent(contentId: string, action: 'approve' | 'reject') {
    return apiFetch<ApiResponse<ModerationItem>>(`/admin/moderation/${contentId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  listUsers(params?: { page?: number; limit?: number; role?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.role) qs.set('role', params.role);
    return apiFetch<ApiResponse<unknown[]>>(`/admin/users?${qs.toString()}`);
  },

  updateUser(userId: string, payload: Record<string, unknown>) {
    return apiFetch<ApiResponse<unknown>>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  listContent(params?: { page?: number; limit?: number; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return apiFetch<ApiResponse<Article[]>>(`/admin/content?${qs.toString()}`);
  },
};

// ─── searchApi ────────────────────────────────────────────────────────────────

export const searchApi = {
  query(q: string, params?: { page?: number; limit?: number; type?: string }) {
    const qs = new URLSearchParams({ q });
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.type) qs.set('type', params.type);
    return apiFetch<ApiResponse<SearchResult[]>>(`/search?${qs.toString()}`);
  },

  trending() {
    return apiFetch<ApiResponse<SearchResult[]>>('/search/trending');
  },

  suggestions(q: string) {
    return apiFetch<ApiResponse<string[]>>(`/search/suggestions?q=${encodeURIComponent(q)}`);
  },
};

// ─── analyticsApi ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  getPlatformOverview() {
    return apiFetch<ApiResponse<AnalyticsOverview>>('/analytics/overview');
  },

  getCreatorAnalytics(creatorId: string) {
    return apiFetch<ApiResponse<unknown>>(`/analytics/creators/${creatorId}`);
  },

  getPageViews(params?: { from?: string; to?: string; granularity?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.granularity) qs.set('granularity', params.granularity);
    return apiFetch<ApiResponse<Array<{ date: string; views: number }>>>(`/analytics/page-views?${qs.toString()}`);
  },

  getEngagement(params?: { from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return apiFetch<ApiResponse<unknown>>(`/analytics/engagement?${qs.toString()}`);
  },
};

// ─── premiumApi ───────────────────────────────────────────────────────────────

export const premiumApi = {
  getTiers() {
    return apiFetch<ApiResponse<SubscriptionTier[]>>('/premium/tiers');
  },

  getSubscriptionStatus() {
    return apiFetch<ApiResponse<{ tier: string; expiresAt: string | null; active: boolean }>>('/premium/status');
  },

  upgrade(tierId: string) {
    return apiFetch<ApiResponse<{ checkoutUrl: string }>>('/premium/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tierId }),
    });
  },

  cancel() {
    return apiFetch<ApiResponse<null>>('/premium/cancel', { method: 'POST' });
  },
};
