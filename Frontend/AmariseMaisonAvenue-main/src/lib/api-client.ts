/**
 * @fileOverview BAALVION / AMARISE — Production API Client (store-scoped, canonical).
 *
 * Aligned to the backend-canonical, store-scoped commerce contract:
 *   products → commerce-service  /commerce/stores/:storeId/products
 *   orders   → order-service     /orders/stores/:storeId/orders
 * storeId is resolved via STORE_CONTEXT_RESOLVER (JWT store_id → subdomain → NEXT_PUBLIC_STORE_ID).
 *
 * Endpoints with NO backend are NOT faked — they return a typed NOT_IMPLEMENTED result
 * (code 501) so failures are explicit, never silent 404s. See README / audit for the gap list:
 *   - product getBySlug          (commerce-service has no /slug/:slug)
 *   - inventory stock/locks      (inventory-service is warehouse-scoped; no variant-stock or lock API)
 *   - cart (userId-keyed)        (order-service carts are cartId-keyed — model reconciliation needed)
 *   - search, analytics          (not implemented in any backend service)
 */

import { getStoreId } from './store-context';
import { unwrapResponse, ApiEnvelopeError } from './unwrap';

// ── Base URLs (gateway namespaces; each service mounts /api/v1) ──────────────
const COMMERCE_URL  = process.env.NEXT_PUBLIC_COMMERCE_URL  || 'https://api.baalvion.com/api/v1/commerce/commerce/api/v1';
const ORDER_URL     = process.env.NEXT_PUBLIC_ORDER_URL     || 'https://api.baalvion.com/api/v1/commerce/order/api/v1';
const INVENTORY_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || 'https://api.baalvion.com/api/v1/commerce/inventory/api/v1';

// ── Shared Types ─────────────────────────────────────────────────────────────

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

// ── Degradation helpers (explicit, never fake) ───────────────────────────────

/** Backend endpoint does not exist — surfaced explicitly, never a hidden 404. */
function notImplemented<T>(feature: string): Promise<ApiResult<T>> {
  return Promise.resolve({
    ok: false,
    error: { message: `NOT_IMPLEMENTED: ${feature} has no backend endpoint`, code: 501 },
  });
}

/** No active store could be resolved — caller must configure STORE context. */
function missingStore<T>(): Promise<ApiResult<T>> {
  return Promise.resolve({
    ok: false,
    error: { message: 'STORE_CONTEXT_MISSING: no storeId (set NEXT_PUBLIC_STORE_ID or store_id JWT claim)', code: 400 },
  });
}

// ── Auth Helper ──────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
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

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers ?? {}) },
    });

    if (!res.ok) {
      let errorBody: ApiError = { message: res.statusText, code: res.status };
      try {
        const json = await res.json();
        const env = (json && json.error) || json || {};
        errorBody = { message: env.message || res.statusText, code: res.status, details: env.details };
      } catch { /* non-JSON error body */ }
      return { ok: false, error: errorBody };
    }

    // Funnel every successful body through the single envelope adapter.
    const data = unwrapResponse<T>(await res.json());
    return { ok: true, data };
  } catch (err: unknown) {
    if (err instanceof ApiEnvelopeError) {
      return { ok: false, error: { message: err.message, code: 422, details: err.details } };
    }
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

// ── productApi (store-scoped: /commerce/stores/:storeId/products) ────────────

export const productApi = {
  list(filters: ProductFilters = {}): Promise<ApiResult<PaginatedResponse<ProductListItem>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<ProductListItem>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<ProductListItem>>(
      `${COMMERCE_URL}/commerce/stores/${storeId}/products${qs ? `?${qs}` : ''}`,
    );
  },

  get(productId: string): Promise<ApiResult<ProductDetail>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<ProductDetail>();
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/commerce/stores/${storeId}/products/${productId}`);
  },

  // Backend has no /slug/:slug lookup — explicitly unimplemented (do not fake).
  getBySlug(_slug: string): Promise<ApiResult<ProductDetail>> {
    return notImplemented<ProductDetail>('product lookup by slug (use productApi.get by id)');
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
    const storeId = getStoreId();
    if (!storeId) return missingStore<ProductDetail>();
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/commerce/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(productId: string, data: Partial<ProductDetail>): Promise<ApiResult<ProductDetail>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<ProductDetail>();
    return apiFetch<ProductDetail>(`${COMMERCE_URL}/commerce/stores/${storeId}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(productId: string): Promise<ApiResult<{ deleted: boolean }>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<{ deleted: boolean }>();
    return apiFetch<{ deleted: boolean }>(`${COMMERCE_URL}/commerce/stores/${storeId}/products/${productId}`, {
      method: 'DELETE',
    });
  },
};

// ── Inventory Types ────────────────────────────────────────────────────────

// ── collectionsApi (store-scoped: /commerce/stores/:storeId/collections) ──────
export interface BackendCollection {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
}

export const collectionsApi = {
  list(): Promise<ApiResult<PaginatedResponse<BackendCollection>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<BackendCollection>>();
    return apiFetch<PaginatedResponse<BackendCollection>>(
      `${COMMERCE_URL}/commerce/stores/${storeId}/collections`,
    );
  },
};

// ── categoriesApi (store-scoped: /commerce/stores/:storeId/categories) ────────
// TODO(nav): backend categories are available here, but the storefront NAV still reads
// static category constants from mock-data (not the store). Wiring the nav to this API
// means editing the navigation components' data source — deferred to avoid a nav redesign.
// (Backend categories are a parentId tree; building the FE subcategory list is a follow-up.)
export interface BackendCategory {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  imageUrl?: string | null;
}

export const categoriesApi = {
  list(): Promise<ApiResult<BackendCategory[]>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<BackendCategory[]>();
    return apiFetch<BackendCategory[]>(
      `${COMMERCE_URL}/commerce/stores/${storeId}/categories`,
    );
  },
};

// ── Inventory Types ──────────────────────────────────────────────────────────

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

// ── inventoryApi ─────────────────────────────────────────────────────────────
// Backend inventory-service is WAREHOUSE-scoped (/inventory/stores/:storeId/warehouses/...
// and /inventory/stores/:storeId/stock list). There is NO variant-level stock lookup,
// no bulk endpoint, and NO reservation/lock API. All methods are explicitly unimplemented.
// (Canonical base, when these are built: `${INVENTORY_URL}/inventory/stores/:storeId/...`)
const INVENTORY_CANONICAL_BASE = `${INVENTORY_URL}/inventory/stores`;

export const inventoryApi = {
  getStock(_variantId: string): Promise<ApiResult<StockLevel>> {
    return notImplemented<StockLevel>(`variant stock lookup (backend is warehouse-scoped: ${INVENTORY_CANONICAL_BASE}/:storeId/stock)`);
  },
  getBulkStock(_variantIds: string[]): Promise<ApiResult<StockLevel[]>> {
    return notImplemented<StockLevel[]>('bulk stock lookup');
  },
  lock(_variantId: string, _userId: string, _quantity = 1): Promise<ApiResult<LockResult>> {
    return notImplemented<LockResult>('inventory reservation/lock (no lock API in inventory-service)');
  },
  release(_lockId: string): Promise<ApiResult<{ released: boolean }>> {
    return notImplemented<{ released: boolean }>('inventory lock release');
  },
  confirm(_lockId: string, _orderId: string): Promise<ApiResult<{ confirmed: boolean }>> {
    return notImplemented<{ confirmed: boolean }>('inventory lock confirm');
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

/** Matches order-service createOrderSchema (items-based — there is NO cart→order endpoint;
 *  productId/variantId are optional, so an order needs only sku/name/quantity/price). */
export interface OrderItemInput {
  quantity: number;
  productId?: string;   // backend requires a valid uuid product ref (resolver rejects otherwise)
  variantId?: string;   // optional; backend resolves the default variant when omitted
  // Server-authoritative — re-derived from commerce data; never sent as authoritative by the client.
  sku?: string;
  name?: string;
  price?: number;
  variantName?: string;
  compareAtPrice?: number;
  taxAmount?: number;
}

export interface CreateOrderPayload {
  currencyCode: string;
  items: OrderItemInput[];
  customerId?: string;
  shippingAmount?: number;
  discountCode?: string;
  notes?: string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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

// ── orderApi (store-scoped: /orders/stores/:storeId/orders) ──────────────────

export const orderApi = {
  create(payload: CreateOrderPayload): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  get(orderId: string): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}`);
  },

  list(filters: OrderFilters = {}): Promise<ApiResult<PaginatedResponse<Order>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<Order>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Order>>(`${ORDER_URL}/orders/stores/${storeId}/orders${qs ? `?${qs}` : ''}`);
  },

  cancel(orderId: string, reason?: string): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/cancel`, {
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

// ── cartApi (store-scoped, CART-ID keyed: /orders/stores/:storeId/carts) ──────
// Fully backed by order-service. Cart identity is the server cartId (NOT userId);
// callers obtain/persist it via src/lib/cart-session.ts (createCart → store cartId).

export interface CreateCartPayload { currencyCode?: string; customerId?: string; sessionId?: string; }
export interface CartItemInput { productId: string; variantId: string; quantity: number; }

export const cartApi = {
  create(payload: CreateCartPayload = {}): Promise<ApiResult<Cart>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Cart>();
    return apiFetch<Cart>(`${ORDER_URL}/orders/stores/${storeId}/carts`, {
      method: 'POST',
      body: JSON.stringify({ currencyCode: 'USD', ...payload }),
    });
  },

  get(cartId: string): Promise<ApiResult<Cart>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Cart>();
    return apiFetch<Cart>(`${ORDER_URL}/orders/stores/${storeId}/carts/${cartId}`);
  },

  addItem(cartId: string, item: CartItemInput): Promise<ApiResult<Cart>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Cart>();
    return apiFetch<Cart>(`${ORDER_URL}/orders/stores/${storeId}/carts/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  updateItem(cartId: string, item: CartItemInput): Promise<ApiResult<Cart>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Cart>();
    return apiFetch<Cart>(`${ORDER_URL}/orders/stores/${storeId}/carts/${cartId}/items`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
  },

  removeItem(cartId: string, sel: { variantId: string; productId: string }): Promise<ApiResult<null>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<null>();
    const qs = new URLSearchParams(sel).toString();
    return apiFetch<null>(`${ORDER_URL}/orders/stores/${storeId}/carts/${cartId}/items?${qs}`, {
      method: 'DELETE',
    });
  },

  clear(cartId: string): Promise<ApiResult<null>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<null>();
    return apiFetch<null>(`${ORDER_URL}/orders/stores/${storeId}/carts/${cartId}`, {
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

// ── searchApi — NOT IMPLEMENTED in any backend service ───────────────────────
export const searchApi = {
  semantic(_payload: SearchPayload): Promise<ApiResult<SearchResult>> {
    return notImplemented<SearchResult>('store-scoped product search');
  },
  autocomplete(_query: string): Promise<ApiResult<string[]>> {
    return notImplemented<string[]>('search autocomplete');
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

// ── analyticsApi — NOT IMPLEMENTED (no store-scoped analytics in backend) ─────
export const analyticsApi = {
  summary(_filters: AnalyticsFilters): Promise<ApiResult<AnalyticsSummary>> {
    return notImplemented<AnalyticsSummary>('commerce analytics summary');
  },
  topProducts(_filters: AnalyticsFilters, _limit = 10): Promise<ApiResult<TopProduct[]>> {
    return notImplemented<TopProduct[]>('commerce analytics top-products');
  },
  salesByCountry(_filters: AnalyticsFilters): Promise<ApiResult<Record<string, number>>> {
    return notImplemented<Record<string, number>>('commerce analytics by-country');
  },
  revenueTimeSeries(
    _filters: AnalyticsFilters,
    _granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<ApiResult<{ date: string; revenue: number }[]>> {
    return notImplemented<{ date: string; revenue: number }[]>('commerce analytics revenue time-series');
  },
};
