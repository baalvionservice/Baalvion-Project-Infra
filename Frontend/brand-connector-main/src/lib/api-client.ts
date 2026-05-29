/**
 * Brand Service API Client
 * Connects to brand-service (:3006) for all brand/creator/CRM operations.
 * Auth tokens are retrieved from the AuthContext (Firebase + JWT fallback).
 */

import { setAccessToken as setBaalvionToken } from '@/lib/baalvion';

// Same-origin by default: the typed endpoints resolve to the Next BFF route handlers
// under src/app/api/* (which forward the Bearer token and proxy to BRAND_API_URL server-side).
// Staying same-origin keeps the strict production CSP (`connect-src 'self'`) satisfied.
const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_API_URL || '';
// Same-origin proxy (next.config rewrite → gateway) so the httpOnly refresh cookie flows.
const AUTH_URL = '/auth-bff';

// ─── Token helpers ─────────────────────────────────────────────────────────────
// SECURITY (P0): access token in memory ONLY. Refresh token = httpOnly cookie set by auth-service.
let _accessToken: string | null = null;

export const brandTokenStore = {
  getAccess: (): string | null => _accessToken,
  getRefresh: (): string | null => null, // refresh token is the httpOnly cookie — not JS-readable
  set: (access: string, _refresh?: string) => {
    _accessToken = access || null;
    // Keep the baalvion axios client (used by the fb-compat REST shim → 64 pages) in sync,
    // otherwise those pages would call the backend unauthenticated.
    setBaalvionToken(_accessToken);
  },
  clear: () => {
    _accessToken = null;
    setBaalvionToken(null);
  },
};

// ─── Core fetch with 401 refresh ──────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshJwt(): Promise<string | null> {
  try {
    // No body: the refresh token rides the httpOnly cookie. Backend rotates it.
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? json;
    const newAccess: string = raw.accessToken ?? raw.token ?? '';
    if (!newAccess) return null;
    brandTokenStore.set(newAccess);
    return newAccess;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = brandTokenStore.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BRAND_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BRAND_URL}${path}`, { ...options, headers });
      }
    } else {
      isRefreshing = true;
      const newToken = await refreshJwt();
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      isRefreshing = false;

      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BRAND_URL}${path}`, { ...options, headers });
      } else {
        brandTokenStore.clear();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        throw new Error('Session expired');
      }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(
        json?.error?.message || json?.message || `Request failed (${res.status})`,
      ),
      { status: res.status, code: json?.error?.code || 'UNKNOWN' },
    );
  }
  return (json.data ?? json) as T;
}

const get = <T>(path: string, qs?: Record<string, string>) => {
  const query = qs
    ? '?' + new URLSearchParams(Object.entries(qs).filter(([, v]) => v !== undefined)).toString()
    : '';
  return apiFetch<T>(`${path}${query}`);
};
const post = <T>(path: string, body?: object) =>
  apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const put = <T>(path: string, body?: object) =>
  apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: object) =>
  apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' });

// ─── Campaign API ──────────────────────────────────────────────────────────────
export interface CampaignListParams {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export const campaignApi = {
  list: (params?: CampaignListParams) =>
    get<unknown>('/api/campaigns', params as Record<string, string>),
  create: (data: object) => post<unknown>('/api/campaigns', data),
  get: (id: string) => get<unknown>(`/api/campaigns/${id}`),
  update: (id: string, data: object) => put<unknown>(`/api/campaigns/${id}`, data),
  delete: (id: string) => del<unknown>(`/api/campaigns/${id}`),
  launch: (id: string) => post<unknown>(`/api/campaigns/${id}/launch`),
  pause: (id: string) => post<unknown>(`/api/campaigns/${id}/pause`),
};

// ─── Creator API ───────────────────────────────────────────────────────────────
export interface CreatorSearchParams {
  search?: string;
  niche?: string;
  minFollowers?: string;
  maxFollowers?: string;
  page?: string;
}

export const creatorApi = {
  search: (params?: CreatorSearchParams) =>
    get<unknown>('/api/creators', params as Record<string, string>),
  shortlist: (data: { creatorId: string; dealId: string }) =>
    post<unknown>('/api/creators/shortlist', data),
  getProfile: (id: string) => get<unknown>(`/api/creators/${id}`),
  updateRates: (id: string, rates: object) =>
    patch<unknown>(`/api/creators/${id}/rates`, rates),
};

// ─── Deal API ──────────────────────────────────────────────────────────────────
export interface DealListParams {
  page?: string;
  status?: string;
}

export const dealApi = {
  list: (params?: DealListParams) =>
    get<unknown>('/api/deals', params as Record<string, string>),
  create: (data: object) => post<unknown>('/api/deals', data),
  get: (id: string) => get<unknown>(`/api/deals/${id}`),
  updateStatus: (id: string, status: string) =>
    patch<unknown>(`/api/deals/${id}`, { status }),
  addNote: (id: string, note: object) => post<unknown>(`/api/deals/${id}/note`, note),
  convertFromReply: (data: object) => post<unknown>('/api/deals/convert-from-reply', data),
};

// ─── Lead API ──────────────────────────────────────────────────────────────────
export interface LeadListParams {
  page?: string;
  status?: string;
  niche?: string;
  search?: string;
}

export const leadApi = {
  list: (params?: LeadListParams) =>
    get<unknown>('/api/leads', params as Record<string, string>),
  create: (data: object) => post<unknown>('/api/leads', data),
  get: (id: string) => get<unknown>(`/api/leads/${id}`),
  score: (id: string) => post<unknown>(`/api/leads/${id}/score`),
  convertToDeal: (id: string, data?: object) =>
    post<unknown>(`/api/leads/${id}/convert`, data),
  addNote: (id: string, note: object) => post<unknown>(`/api/leads/${id}/notes`, note),
};

// ─── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  campaignAnalytics: (id: string) => get<unknown>(`/api/analytics/campaign/${id}`),
  creatorAnalytics: (campaignId: string) =>
    get<unknown>(`/api/analytics/creators/${campaignId}`),
  overview: () => get<unknown>('/api/analytics/overview'),
};

// ─── Billing API ───────────────────────────────────────────────────────────────
export const billingApi = {
  plans: () => get<unknown>('/api/billing/plans'),
  subscribe: (data: { planId: string; interval?: string }) =>
    post<unknown>('/api/billing/subscribe', data),
  currentSubscription: () => get<unknown>('/api/billing/subscription'),
  invoices: () => get<unknown>('/api/billing/invoices'),
  cancel: (data?: { atPeriodEnd?: boolean }) =>
    post<unknown>('/api/billing/cancel', data),
};

// ─── Payment API ───────────────────────────────────────────────────────────────
export const paymentApi = {
  createEscrow: (data: object) => post<unknown>('/api/payments/create', data),
  releasePayment: (id: string, data?: object) =>
    post<unknown>(`/api/payments/${id}/release`, data),
  paymentHistory: (params?: { page?: string }) =>
    get<unknown>('/api/payments', params as Record<string, string>),
};

// ─── Notification API ──────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => get<unknown>('/api/notifications'),
  markRead: (id: string) => patch<unknown>(`/api/notifications/${id}/read`),
  markAllRead: () => post<unknown>('/api/notifications/read-all'),
};

// ─── Onboarding API ────────────────────────────────────────────────────────────
export const onboardingApi = {
  saveProgress: (data: object) => post<unknown>('/api/onboarding/save', data),
  completeOnboarding: (data?: object) =>
    post<unknown>('/api/onboarding/complete', data),
  getProgress: () => get<unknown>('/api/onboarding'),
};

// ─── Team API ──────────────────────────────────────────────────────────────────
export const teamApi = {
  listMembers: () => get<unknown>('/api/team'),
  invite: (data: { email: string; role: string }) => post<unknown>('/api/team', data),
  updateRole: (id: string, role: string) =>
    patch<unknown>(`/api/team/${id}/role`, { role }),
  remove: (id: string) => del<unknown>(`/api/team/${id}`),
};

// ─── Outreach API ──────────────────────────────────────────────────────────────
export const outreachApi = {
  campaigns: () => get<unknown>('/api/outreach/campaigns'),
  messages: (params?: { campaignId?: string }) =>
    get<unknown>('/api/outreach/messages', params as Record<string, string>),
  send: (data: object) => post<unknown>('/api/outreach/send', data),
  simulateReplies: (data?: object) =>
    post<unknown>('/api/outreach/simulate-replies', data),
  createCampaign: (data: object) => post<unknown>('/api/outreach/campaign', data),
};

export { AUTH_URL };
