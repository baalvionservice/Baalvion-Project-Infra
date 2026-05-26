/**
 * @fileOverview BAALVION / AMARISE - Production API Client
 * Typed modules for real-estate-service (:3005), commerce-service (:3012),
 * inventory-service (:3014), and order-service (:3013).
 */

// ── Base URLs ──────────────────────────────────────────────────────────────
const REAL_ESTATE_URL = process.env.NEXT_PUBLIC_REAL_ESTATE_URL || 'http://localhost:3005';
const COMMERCE_URL   = process.env.NEXT_PUBLIC_COMMERCE_URL   || 'http://localhost:3012';
const INVENTORY_URL  = process.env.NEXT_PUBLIC_INVENTORY_URL  || 'http://localhost:3014';
const ORDER_URL      = process.env.NEXT_PUBLIC_ORDER_URL      || 'http://localhost:3013';

// ── Shared Types ───────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth Helper ────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Prefer cookie value first, fall back to localStorage
  const cookieMatch = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
  return localStorage.getItem('authToken');
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Core Fetch Wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers ?? {}) },
    });

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

// ── Product Types ──────────────────────────────────────────────────────────

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  imageUrl: string[];
  categoryId: string;
  collectionId: string;
  stock: number;
  status: 'draft' | 'published';
  brandId: string;
  isVip: boolean;
  rating: number;
  reviewsCount: number;
}

export interface ProductDetail extends ProductListItem {
  departmentId: string;
  subcategoryId: string;
  description?: string;
  colors?: string[];
  sizes?: string[];
  condition?: string;
  conditionDetails?: string;
  vendorId?: string;
  regions: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductFilters {
  categoryId?: string;
  collectionId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: 'draft' | 'published';
  page?: number;
  pageSize?: number;
}

// ── productApi ─────────────────────────────────────────────────────────────

export const productApi = {
  list(filters: ProductFilters = {}): Promise<ApiResult<PaginatedResponse<ProductListItem>>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<ProductListItem>>(
      `${COMMERCE_URL}/products${qs ? `?${qs}` : ''}`,
    );
  },

  get(productId: string): Promise<ApiResult<ProductDetail>> {
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/products/${productId}`);
  },

  getBySlug(slug: string): Promise<ApiResult<ProductDetail>> {
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/products/slug/${slug}`);
  },

  byCategory(
    categoryId: string,
    filters: Omit<ProductFilters, 'categoryId'> = {},
  ): Promise<ApiResult<PaginatedResponse<ProductListItem>>> {
    return productApi.list({ ...filters, categoryId });
  },

  byCollection(
    collectionId: string,
    filters: Omit<ProductFilters, 'collectionId'> = {},
  ): Promise<ApiResult<PaginatedResponse<ProductListItem>>> {
    return productApi.list({ ...filters, collectionId });
  },

  create(data: Partial<ProductDetail>): Promise<ApiResult<ProductDetail>> {
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(productId: string, data: Partial<ProductDetail>): Promise<ApiResult<ProductDetail>> {
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(productId: string): Promise<ApiResult<{ deleted: boolean }>> {
    return apiFetch<{ deleted: boolean }>(`${COMMERCE_URL}/products/${productId}`, {
      method: 'DELETE',
    });
  },
};

// ── Inventory Types ────────────────────────────────────────────────────────

export interface StockLevel {
  variantId: string;
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  updatedAt: string;
}

export interface LockResult {
  lockId: string;
  variantId: string;
  userId: string;
  quantity: number;
  expiresAt: string;
  ttlMinutes: number;
}

// ── inventoryApi ───────────────────────────────────────────────────────────

export const inventoryApi = {
  getStock(variantId: string): Promise<ApiResult<StockLevel>> {
    return apiFetch<StockLevel>(`${INVENTORY_URL}/stock/${variantId}`);
  },

  getBulkStock(variantIds: string[]): Promise<ApiResult<StockLevel[]>> {
    return apiFetch<StockLevel[]>(`${INVENTORY_URL}/stock/bulk`, {
      method: 'POST',
      body: JSON.stringify({ variantIds }),
    });
  },

  lock(variantId: string, userId: string, quantity = 1): Promise<ApiResult<LockResult>> {
    return apiFetch<LockResult>(`${INVENTORY_URL}/locks`, {
      method: 'POST',
      body: JSON.stringify({ variantId, userId, quantity }),
    });
  },

  release(lockId: string): Promise<ApiResult<{ released: boolean }>> {
    return apiFetch<{ released: boolean }>(`${INVENTORY_URL}/locks/${lockId}`, {
      method: 'DELETE',
    });
  },

  confirm(lockId: string, orderId: string): Promise<ApiResult<{ confirmed: boolean }>> {
    return apiFetch<{ confirmed: boolean }>(`${INVENTORY_URL}/locks/${lockId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
};

// ── Order Types ────────────────────────────────────────────────────────────

export interface OrderLineItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lockId?: string;
}

export interface CreateOrderPayload {
  userId: string;
  items: OrderLineItem[];
  currency: string;
  country: string;
  shippingAddress?: Record<string, string>;
  idempotencyKey?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderLineItem[];
  currency: string;
  country: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  shippingAddress?: Record<string, string>;
}

export interface OrderFilters {
  userId?: string;
  status?: Order['status'];
  page?: number;
  pageSize?: number;
}

// ── orderApi ───────────────────────────────────────────────────────────────

export const orderApi = {
  create(payload: CreateOrderPayload): Promise<ApiResult<Order>> {
    return apiFetch<Order>(`${ORDER_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  get(orderId: string): Promise<ApiResult<Order>> {
    return apiFetch<Order>(`${ORDER_URL}/orders/${orderId}`);
  },

  list(filters: OrderFilters = {}): Promise<ApiResult<PaginatedResponse<Order>>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Order>>(`${ORDER_URL}/orders${qs ? `?${qs}` : ''}`);
  },

  cancel(orderId: string, reason?: string): Promise<ApiResult<Order>> {
    return apiFetch<Order>(`${ORDER_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getByUser(userId: string, page = 1, pageSize = 20): Promise<ApiResult<PaginatedResponse<Order>>> {
    return orderApi.list({ userId, page, pageSize });
  },
};

// ── Cart Types ─────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  name: string;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  updatedAt: string;
}

// ── cartApi ────────────────────────────────────────────────────────────────
// Cart state is managed via order-service draft orders

export const cartApi = {
  get(userId: string): Promise<ApiResult<Cart>> {
    return apiFetch<Cart>(`${ORDER_URL}/cart/${userId}`);
  },

  add(userId: string, item: Omit<CartItem, 'name' | 'imageUrl'> & { name?: string; imageUrl?: string }): Promise<ApiResult<Cart>> {
    return apiFetch<Cart>(`${ORDER_URL}/cart/${userId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  updateQuantity(userId: string, variantId: string, quantity: number): Promise<ApiResult<Cart>> {
    return apiFetch<Cart>(`${ORDER_URL}/cart/${userId}/items/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  remove(userId: string, variantId: string): Promise<ApiResult<Cart>> {
    return apiFetch<Cart>(`${ORDER_URL}/cart/${userId}/items/${variantId}`, {
      method: 'DELETE',
    });
  },

  clear(userId: string): Promise<ApiResult<{ cleared: boolean }>> {
    return apiFetch<{ cleared: boolean }>(`${ORDER_URL}/cart/${userId}`, {
      method: 'DELETE',
    });
  },
};

// ── Search Types ───────────────────────────────────────────────────────────

export interface SearchResult {
  products: ProductListItem[];
  total: number;
  query: string;
  suggestions?: string[];
}

export interface SearchPayload {
  query: string;
  country?: string;
  filters?: ProductFilters;
  page?: number;
  pageSize?: number;
}

// ── searchApi ──────────────────────────────────────────────────────────────

export const searchApi = {
  semantic(payload: SearchPayload): Promise<ApiResult<SearchResult>> {
    return apiFetch<SearchResult>(`${COMMERCE_URL}/search`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  autocomplete(query: string): Promise<ApiResult<string[]>> {
    const params = new URLSearchParams({ q: query });
    return apiFetch<string[]>(`${COMMERCE_URL}/search/autocomplete?${params}`);
  },
};

// ── Analytics Types ────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

export interface AnalyticsFilters {
  from: string;
  to: string;
  country?: string;
  brandId?: string;
}

// ── analyticsApi ───────────────────────────────────────────────────────────

export const analyticsApi = {
  summary(filters: AnalyticsFilters): Promise<ApiResult<AnalyticsSummary>> {
    const params = new URLSearchParams(filters as Record<string, string>);
    return apiFetch<AnalyticsSummary>(`${COMMERCE_URL}/admin/analytics/summary?${params}`);
  },

  topProducts(filters: AnalyticsFilters, limit = 10): Promise<ApiResult<TopProduct[]>> {
    const params = new URLSearchParams({ ...filters, limit: String(limit) } as Record<string, string>);
    return apiFetch<TopProduct[]>(`${COMMERCE_URL}/admin/analytics/top-products?${params}`);
  },

  salesByCountry(filters: AnalyticsFilters): Promise<ApiResult<Record<string, number>>> {
    const params = new URLSearchParams(filters as Record<string, string>);
    return apiFetch<Record<string, number>>(`${COMMERCE_URL}/admin/analytics/by-country?${params}`);
  },

  revenueTimeSeries(
    filters: AnalyticsFilters,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<ApiResult<{ date: string; revenue: number }[]>> {
    const params = new URLSearchParams({ ...filters, granularity } as Record<string, string>);
    return apiFetch<{ date: string; revenue: number }[]>(
      `${COMMERCE_URL}/admin/analytics/revenue?${params}`,
    );
  },
};
