/**
 * @fileOverview Mining.Baalvion — Production API Client
 * Connects to mining-service (:3003) and auth-proxy (:4000).
 * Includes automatic token refresh on 401.
 */

// ── Base URLs ──────────────────────────────────────────────────────────────
const MINING_URL = process.env.NEXT_PUBLIC_MINING_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/mining';
// Auth via the SAME-ORIGIN proxy (next.config rewrite → gateway) so the httpOnly
// `baalvion_refresh` cookie flows in dev and prod. NEVER an absolute cross-origin URL.
const AUTH_URL   = '/auth-bff';

// ── Shared Response Types ──────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
}

export type ApiResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: ApiError };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Token Management (in-memory access token; refresh via httpOnly cookie) ──
// SECURITY (P0): NO localStorage/sessionStorage. The access token lives only in this
// module's memory; the refresh token is the httpOnly `baalvion_refresh` cookie.

let _accessToken: string | null = null;
let _user: UserProfile | null = null;
let _refreshPromise: Promise<string | null> | null = null;

function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

/** Current authenticated user (in-memory), populated by authApi.login()/me(). */
export function getCurrentUser(): UserProfile | null {
  return _user;
}

async function doRefresh(): Promise<string | null> {
  try {
    // No body: the refresh token rides the httpOnly cookie. Backend rotates it.
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const raw = body.data ?? body;
    const access: string = raw.accessToken ?? raw.token ?? '';
    if (!access) return null;
    _accessToken = access;
    return access;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts (single-flight)
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ── Core Fetch Wrapper (with 401 retry) ───────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  retry = true,
  withCredentials = false,
): Promise<ApiResult<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // credentials:'include' only for same-origin auth calls (so the httpOnly cookie flows);
    // cross-origin data calls stay credential-less to avoid CORS-credentials requirements.
    const res = await fetch(url, { ...options, headers, ...(withCredentials ? { credentials: 'include' as RequestCredentials } : {}) });

    if (res.status === 401 && retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(url, options, false, withCredentials);
      }
      return { ok: false, error: { message: 'Unauthorized', code: 401 } };
    }

    if (!res.ok) {
      let errorBody: ApiError = { message: res.statusText, code: res.status };
      try { errorBody = { ...(await res.json()), code: res.status }; } catch { /* ignore */ }
      return { ok: false, error: errorBody };
    }

    const data: T = await res.json();
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: { message, code: 0 } };
  }
}

// ── Marketplace Types ──────────────────────────────────────────────────────

export interface MineralProduct {
  id: string;
  slug: string;
  name: string;
  grade: string;
  category: string;
  origin: string;
  pricePerMt?: number;
  currency?: string;
  purity?: number;
  moisture?: number;
  description?: string;
  imageUrl?: string;
  status: 'available' | 'high_demand' | 'sold_out' | 'pending';
  verifiedExporter: boolean;
  supplierId: string;
  certifications?: string[];
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  origin?: string;
  minPurity?: number;
  maxMoisture?: number;
  verifiedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SearchPayload {
  query: string;
  filters?: ProductFilters;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  products: MineralProduct[];
  suppliers: MiningCompany[];
  total: number;
  query: string;
}

// ── marketplaceApi ─────────────────────────────────────────────────────────

export const marketplaceApi = {
  list(filters: ProductFilters = {}): Promise<ApiResult<PaginatedResponse<MineralProduct>>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<MineralProduct>>(
      `${MINING_URL}/api/products${qs ? `?${qs}` : ''}`,
    );
  },

  get(productId: string): Promise<ApiResult<MineralProduct>> {
    return apiFetch<MineralProduct>(`${MINING_URL}/api/products/${productId}`);
  },

  getBySlug(slug: string): Promise<ApiResult<MineralProduct>> {
    return apiFetch<MineralProduct>(`${MINING_URL}/api/products/slug/${slug}`);
  },

  search(payload: SearchPayload): Promise<ApiResult<SearchResult>> {
    return apiFetch<SearchResult>(`${MINING_URL}/api/search`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  filter(filters: ProductFilters): Promise<ApiResult<PaginatedResponse<MineralProduct>>> {
    return marketplaceApi.list(filters);
  },

  compare(productIds: string[]): Promise<ApiResult<MineralProduct[]>> {
    return apiFetch<MineralProduct[]>(`${MINING_URL}/api/products/compare`, {
      method: 'POST',
      body: JSON.stringify({ ids: productIds }),
    });
  },

  related(productId: string, limit = 3): Promise<ApiResult<MineralProduct[]>> {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiFetch<MineralProduct[]>(
      `${MINING_URL}/api/products/${productId}/related?${params}`,
    );
  },

  relatedBySlug(slug: string, limit = 3): Promise<ApiResult<MineralProduct[]>> {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiFetch<MineralProduct[]>(
      `${MINING_URL}/api/products/slug/${slug}/related?${params}`,
    );
  },
};

// ── Company Types ──────────────────────────────────────────────────────────

export interface MiningCompany {
  id: string;
  slug: string;
  name: string;
  country: string;
  rating: number;
  yearsActive: number;
  verifiedMiner: boolean;
  verifiedExporter: boolean;
  fulfillmentRate: string;
  minerals: string;
  avgLeadTime: string;
  logoUrl?: string;
  description?: string;
  certifications?: string[];
}

export interface CompanyFilters {
  country?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  page?: number;
  pageSize?: number;
}

// ── companyApi ─────────────────────────────────────────────────────────────

export const companyApi = {
  list(filters: CompanyFilters = {}): Promise<ApiResult<PaginatedResponse<MiningCompany>>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<MiningCompany>>(
      `${MINING_URL}/api/companies${qs ? `?${qs}` : ''}`,
    );
  },

  get(companyId: string): Promise<ApiResult<MiningCompany>> {
    return apiFetch<MiningCompany>(`${MINING_URL}/api/companies/${companyId}`);
  },

  getBySlug(slug: string): Promise<ApiResult<MiningCompany>> {
    return apiFetch<MiningCompany>(`${MINING_URL}/api/companies/slug/${slug}`);
  },

  compare(companyIds: string[]): Promise<ApiResult<MiningCompany[]>> {
    return apiFetch<MiningCompany[]>(`${MINING_URL}/api/companies/compare`, {
      method: 'POST',
      body: JSON.stringify({ ids: companyIds }),
    });
  },
};

// ── Trade Types ────────────────────────────────────────────────────────────

export interface TradeInquiry {
  id: string;
  productId?: string;
  supplierId?: string;
  buyerId: string;
  message: string;
  quantity?: number;
  unit?: string;
  status: 'pending' | 'responded' | 'negotiating' | 'closed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateInquiryPayload {
  productId?: string;
  supplierId?: string;
  message: string;
  quantity?: number;
  unit?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ── tradeApi ───────────────────────────────────────────────────────────────

export const tradeApi = {
  createInquiry(payload: CreateInquiryPayload): Promise<ApiResult<TradeInquiry>> {
    return apiFetch<TradeInquiry>(`${MINING_URL}/api/trade/inquiries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getInquiry(inquiryId: string): Promise<ApiResult<TradeInquiry>> {
    return apiFetch<TradeInquiry>(`${MINING_URL}/api/trade/inquiries/${inquiryId}`);
  },

  listInquiries(userId: string, page = 1): Promise<ApiResult<PaginatedResponse<TradeInquiry>>> {
    const params = new URLSearchParams({ buyerId: userId, page: String(page) });
    return apiFetch<PaginatedResponse<TradeInquiry>>(
      `${MINING_URL}/api/trade/inquiries?${params}`,
    );
  },

  updateWorkflow(inquiryId: string, status: TradeInquiry['status']): Promise<ApiResult<TradeInquiry>> {
    return apiFetch<TradeInquiry>(`${MINING_URL}/api/trade/inquiries/${inquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  submitRfq(payload: CreateInquiryPayload & { targetSupplierIds?: string[] }): Promise<ApiResult<TradeInquiry>> {
    return apiFetch<TradeInquiry>(`${MINING_URL}/api/trade/rfq`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ── Logistics Types ────────────────────────────────────────────────────────

export interface ShippingRoute {
  id: string;
  origin: string;
  destination: string;
  transitDays: number;
  carrier: string;
  modes: string[];
  pricePerMt?: number;
}

export interface LogisticsInfo {
  routes: ShippingRoute[];
  customsRequirements: string[];
  certifications: string[];
  incoterms: string[];
}

// ── logisticsApi ───────────────────────────────────────────────────────────

export const logisticsApi = {
  getInfo(origin: string, destination: string): Promise<ApiResult<LogisticsInfo>> {
    const params = new URLSearchParams({ origin, destination });
    return apiFetch<LogisticsInfo>(`${MINING_URL}/api/logistics?${params}`);
  },

  getRoutes(origin?: string): Promise<ApiResult<ShippingRoute[]>> {
    const params = origin ? new URLSearchParams({ origin }) : new URLSearchParams();
    const qs = params.toString();
    return apiFetch<ShippingRoute[]>(`${MINING_URL}/api/logistics/routes${qs ? `?${qs}` : ''}`);
  },

  trackShipment(trackingId: string): Promise<ApiResult<{ status: string; events: { timestamp: string; location: string; message: string }[] }>> {
    return apiFetch(`${MINING_URL}/api/logistics/tracking/${trackingId}`);
  },
};

// ── Admin Types ────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  totalProducts: number;
  totalCompanies: number;
  pendingModerations: number;
  tradeVolume: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface ModerationItem {
  id: string;
  type: 'product' | 'company' | 'review';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  data: Record<string, unknown>;
}

// ── adminApi ───────────────────────────────────────────────────────────────

export const adminApi = {
  analytics(from: string, to: string): Promise<ApiResult<AdminAnalytics>> {
    const params = new URLSearchParams({ from, to });
    return apiFetch<AdminAnalytics>(`${MINING_URL}/api/admin/analytics?${params}`);
  },

  listModerationQueue(status: ModerationItem['status'] = 'pending'): Promise<ApiResult<ModerationItem[]>> {
    const params = new URLSearchParams({ status });
    return apiFetch<ModerationItem[]>(`${MINING_URL}/api/admin/moderation?${params}`);
  },

  moderate(itemId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResult<ModerationItem>> {
    return apiFetch<ModerationItem>(`${MINING_URL}/api/admin/moderation/${itemId}`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  },

  manageProduct(action: 'publish' | 'unpublish' | 'delete', productId: string): Promise<ApiResult<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(`${MINING_URL}/api/admin/products/${productId}/${action}`, {
      method: 'POST',
    });
  },

  manageCompany(action: 'verify' | 'suspend' | 'delete', companyId: string): Promise<ApiResult<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(`${MINING_URL}/api/admin/companies/${companyId}/${action}`, {
      method: 'POST',
    });
  },
};

// ── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
}

// ── authApi ────────────────────────────────────────────────────────────────

export const authApi = {
  async login(payload: LoginPayload): Promise<ApiResult<AuthTokens & { user: UserProfile }>> {
    const result = await apiFetch<AuthTokens & { user: UserProfile }>(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true, true);
    if (result.ok) {
      const d = result.data as unknown as { accessToken?: string; token?: string; user?: UserProfile };
      _accessToken = d.accessToken ?? d.token ?? _accessToken;
      if (d.user) _user = d.user;
    }
    return result;
  },

  async logout(): Promise<ApiResult<{ success: boolean }>> {
    const result = await apiFetch<{ success: boolean }>(`${AUTH_URL}/logout`, { method: 'POST' }, true, true);
    _accessToken = null; // clear in-memory token (no web storage to purge)
    _user = null;
    return result;
  },

  // Refresh rides the httpOnly cookie; the legacy refreshToken arg is ignored.
  refresh(_refreshToken?: string): Promise<ApiResult<AuthTokens>> {
    return apiFetch<AuthTokens>(`${AUTH_URL}/refresh`, { method: 'POST' }, true, true);
  },

  // Resolves the current user; triggers a cookie refresh if the in-memory token is absent/expired.
  async me(): Promise<ApiResult<UserProfile>> {
    const result = await apiFetch<UserProfile>(`${AUTH_URL}/me`, {}, true, true);
    if (result.ok) _user = result.data;
    return result;
  },
};
