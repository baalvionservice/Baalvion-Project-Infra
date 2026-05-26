/**
 * IR-Baalvion API Client
 * Typed modules for ir-service (:3008) domains.
 * Handles JWT auth header attachment and transparent 401 refresh.
 */

import irAuthClient from './auth-client';

const IR_URL = process.env.NEXT_PUBLIC_IR_API_URL || 'http://localhost:3008';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  success?: boolean;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
}

// ─── Investor domain types ────────────────────────────────────────────────────

export interface CapitalSummary {
  totalCommitment: number;
  calledCapital: number;
  remainingCommitment: number;
  distributionsReceived: number;
  nav: number;
  irr?: number;
  moic?: number;
  currency: string;
  asOf: string;
}

export interface CapitalCall {
  id: string;
  callNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  purpose: string;
  issuedAt: string;
}

export interface Distribution {
  id: string;
  amount: number;
  type: 'income' | 'return_of_capital' | 'gain';
  distributedAt: string;
  status: 'scheduled' | 'paid';
  notes?: string;
}

export interface NavHistoryPoint {
  date: string;
  nav: number;
  navPerUnit?: number;
  change?: number;
  changePercent?: number;
}

export interface InvestorDocument {
  id: string;
  title: string;
  type: string;
  category: string;
  fileSize: string;
  uploadedAt: string;
  downloadUrl?: string;
}

// ─── Governance domain types ──────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name: string;
  title: string;
  committee?: string;
  bio?: string;
  avatar?: string;
  independent: boolean;
}

export interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  department?: string;
  bio?: string;
  avatar?: string;
}

export interface ActiveVote {
  id: string;
  resolution: string;
  description?: string;
  deadline: string;
  status: 'open' | 'closed' | 'passed' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  userVote?: 'for' | 'against' | 'abstain' | null;
}

// ─── News domain types ────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  category: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  slug?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  type: string;
  description?: string;
  registrationUrl?: string;
}

export interface PressRelease {
  id: string;
  headline: string;
  body?: string;
  publishedAt: string;
  fileUrl?: string;
}

// ─── Alerts domain types ──────────────────────────────────────────────────────

export interface InvestorAlert {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  targetRoles?: string[];
}

// ─── Core fetcher with auth + 401 refresh ────────────────────────────────────

async function irFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await irAuthClient.getValidToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${IR_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    await irAuthClient.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── investorApi ──────────────────────────────────────────────────────────────

export const investorApi = {
  getCapitalSummary() {
    return irFetch<ApiResponse<CapitalSummary>>('/api/v1/investor/capital-summary');
  },

  getNavHistory(params?: { from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return irFetch<ApiResponse<NavHistoryPoint[]>>(`/api/v1/investor/nav-history?${qs.toString()}`);
  },

  getDistributions() {
    return irFetch<ApiResponse<Distribution[]>>('/api/v1/investor/distributions');
  },

  getDocuments(params?: { category?: string }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    return irFetch<ApiResponse<InvestorDocument[]>>(`/api/v1/investor/documents?${qs.toString()}`);
  },

  getCapitalCalls() {
    return irFetch<ApiResponse<CapitalCall[]>>('/api/v1/investor/capital-calls');
  },

  getActiveVotes() {
    return irFetch<ApiResponse<ActiveVote[]>>('/api/v1/investor/active-votes');
  },
};

// ─── governanceApi ────────────────────────────────────────────────────────────

export const governanceApi = {
  getBoard() {
    return irFetch<ApiResponse<BoardMember[]>>('/api/v1/governance/board');
  },

  getLeadership() {
    return irFetch<ApiResponse<LeadershipMember[]>>('/api/v1/governance/leadership');
  },

  getActiveVotes() {
    return irFetch<ApiResponse<ActiveVote[]>>('/api/v1/governance/voting/active-votes');
  },

  castVote(voteId: string, vote: 'for' | 'against' | 'abstain') {
    return irFetch<ApiResponse<ActiveVote>>(`/api/v1/governance/voting/${voteId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },
};

// ─── newsApi ──────────────────────────────────────────────────────────────────

export const newsApi = {
  list(params?: { page?: number; limit?: number; category?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    return irFetch<ApiResponse<NewsItem[]>>(`/api/v1/news?${qs.toString()}`);
  },

  getEvents(params?: { upcoming?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.upcoming !== undefined) qs.set('upcoming', String(params.upcoming));
    return irFetch<ApiResponse<Event[]>>(`/api/v1/events?${qs.toString()}`);
  },

  getPressReleases(params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return irFetch<ApiResponse<PressRelease[]>>(`/api/v1/press-releases?${qs.toString()}`);
  },
};

// ─── adminApi ─────────────────────────────────────────────────────────────────

export const adminApi = {
  getSubscribers(params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return irFetch<ApiResponse<unknown[]>>(`/api/v1/admin/subscribers?${qs.toString()}`);
  },

  getDataRoom(params?: { category?: string }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    return irFetch<ApiResponse<unknown[]>>(`/api/v1/admin/data-room?${qs.toString()}`);
  },

  getReports(params?: { type?: string }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    return irFetch<ApiResponse<unknown[]>>(`/api/v1/admin/reports?${qs.toString()}`);
  },

  sendNotification(payload: { subject: string; body: string; targetRoles?: string[] }) {
    return irFetch<ApiResponse<null>>('/api/v1/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ─── alertApi ─────────────────────────────────────────────────────────────────

export const alertApi = {
  /**
   * Fetches alerts from ir-service. Replaces the static INITIAL_ALERTS
   * array in src/lib/alerts-mock.ts.
   */
  list(params?: { unreadOnly?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.unreadOnly) qs.set('unreadOnly', 'true');
    return irFetch<ApiResponse<InvestorAlert[]>>(`/api/v1/alerts?${qs.toString()}`);
  },

  markRead(alertId: string) {
    return irFetch<ApiResponse<null>>(`/api/v1/alerts/${alertId}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead() {
    return irFetch<ApiResponse<null>>('/api/v1/alerts/read-all', {
      method: 'PATCH',
    });
  },
};
