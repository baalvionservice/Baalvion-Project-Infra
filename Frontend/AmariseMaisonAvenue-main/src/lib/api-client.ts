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
import { getAccessToken, authClient } from './auth';
import type {
  Consignment,
  ConsignmentItem,
  SellerProfile,
  StoredWishlist,
  StoreAppointment,
  StoreAppointmentType,
  CertificateVerification,
} from './types';

// ── Base URLs (each service mounts its routes under /api/v1) ─────────────────
// IMPORTANT — TWO commerce base URLs, by design:
//   • NEXT_PUBLIC_COMMERCE_URL      → the PUBLIC storefront base (no auth). Owned by
//     catalog.ts, which appends `/commerce/storefront/:storeId/...`. Do NOT use it here.
//   • NEXT_PUBLIC_COMMERCE_API_URL  → the AUTHED/admin commerce base used below for
//     store-scoped routes (`/commerce/stores/:storeId/...`). Falls back to
//     NEXT_PUBLIC_COMMERCE_URL so a single local var still works (both point at
//     `http://localhost:3012/api/v1`), then to the gateway default.
// Each base already ends at `/api/v1` — route helpers append the service path with no
// doubled `/commerce/commerce` or `/api/v1...api/v1` segments.
const COMMERCE_URL  =
  process.env.NEXT_PUBLIC_COMMERCE_API_URL ||
  process.env.NEXT_PUBLIC_COMMERCE_URL ||
  'https://api.baalvion.com/api/v1/commerce';
const ORDER_URL     = process.env.NEXT_PUBLIC_ORDER_URL     || 'https://api.baalvion.com/api/v1/order';
const INVENTORY_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || 'https://api.baalvion.com/api/v1/inventory';

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

// SECURITY (P0): the access token is held in memory by lib/auth (never localStorage/cookie).
function getAuthToken(): string | null {
  return getAccessToken();
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Guest cart session (signed X-Cart-Session) ───────────────────────────────
// order-service binds a guest's cart + order to a server-signed session token (returned by
// cart-create). Persisted so the same anonymous shopper can create → read → pay for their
// order without an account. Authenticated callers use the bearer token instead.
const CART_SESSION_KEY = 'amarise.cartSession';
export function getCartSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(CART_SESSION_KEY); } catch { return null; }
}
export function setCartSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(CART_SESSION_KEY, token);
    else window.localStorage.removeItem(CART_SESSION_KEY);
  } catch { /* storage unavailable — guest checkout degrades to a single request */ }
}
function sessionHeaders(): Record<string, string> {
  const t = getCartSessionToken();
  return t ? { 'X-Cart-Session': t } : {};
}

// ── Core Fetch Wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options: RequestInit = {}, retry = true): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...authHeaders(), ...sessionHeaders(), ...(options.headers ?? {}) },
    });

    // Expired access token → one silent cookie refresh, then retry once.
    if (res.status === 401 && retry) {
      const restored = await authClient.bootstrap();
      if (restored) return apiFetch<T>(url, options, false);
    }

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
  /** Real availability (commerce-service: trackInventory ? stockQuantity>0 : true). Optional for back-compat. */
  inStock?: boolean;
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
  // ── Resale / consignment provenance (commerce-service product, camelCase) ──
  // The admin product editor sets these so a resale piece carries verifiable provenance:
  // condition grade, authenticity status, one-of-a-kind flag, and serial number.
  conditionGrade?: 'pristine' | 'excellent' | 'very_good' | 'good' | 'fair';
  authenticityStatus?: string;
  authenticityCertificateCode?: string;
  isOneOfAKind?: boolean;
  serialNumber?: string;
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
  /** Free-text query → commerce-service ILIKE on name/sku (used by searchApi). */
  search?: string;
  /** Page size as the backend product-list parser names it (alias of pageSize for search). */
  limit?: number;
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
// commerce-service categoryController.list returns the category TREE as a BARE ARRAY via
// sendSuccess(req,res,tree) — NOT a paginated envelope — so BackendCategory[] is the correct
// return type (verified against the controller). The storefront category pages resolve their
// heading from this live taxonomy (see CategoryPageClient) instead of hardcoded slug→label maps.
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
  /** Availability status from inventory-service (e.g. 'in_stock' | 'low_stock' | 'out_of_stock'). */
  status?: string;
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

// ── inventoryApi (store-scoped: /inventory/stores/:storeId/...) ───────────────
// Now fully backed by inventory-service: variant stock lookup, bulk stock, and a
// reservation/lock API. NOTE: there is intentionally NO client `confirm` — reservation
// commitment is SERVER-SIDE (order-service confirms the lock on payment). `confirm` is
// kept only as a safe no-op so legacy call sites compile (see method comment).
const INVENTORY_CANONICAL_BASE = `${INVENTORY_URL}/inventory/stores`;

export const inventoryApi = {
  getStock(variantId: string): Promise<ApiResult<StockLevel>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StockLevel>();
    return apiFetch<StockLevel>(`${INVENTORY_CANONICAL_BASE}/${storeId}/stock/${variantId}`);
  },

  getBulkStock(variantIds: string[]): Promise<ApiResult<StockLevel[]>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StockLevel[]>();
    return apiFetch<StockLevel[]>(`${INVENTORY_CANONICAL_BASE}/${storeId}/stock/bulk`, {
      method: 'POST',
      body: JSON.stringify({ variantIds }),
    });
  },

  // Reserve stock for a variant. Signature preserved (variantId, userId?, quantity) so the
  // existing orchestrator call site keeps compiling; `userId` is optional server-side (the
  // bearer token / guest session identifies the holder).
  lock(
    variantId: string,
    userId?: string,
    quantity = 1,
    productId?: string,
  ): Promise<ApiResult<LockResult>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<LockResult>();
    const body: Record<string, unknown> = { variantId, quantity };
    if (userId) body.userId = userId;
    if (productId) body.productId = productId;
    return apiFetch<LockResult>(`${INVENTORY_CANONICAL_BASE}/${storeId}/locks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  release(lockId: string): Promise<ApiResult<{ released: boolean }>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<{ released: boolean }>();
    return apiFetch<{ released: boolean }>(
      `${INVENTORY_CANONICAL_BASE}/${storeId}/locks/${lockId}/release`,
      { method: 'POST' },
    );
  },

  // No-op: the server now OWNS reservation commitment (order-service confirms the lock on
  // payment). Kept so legacy call sites compile; resolves immediately without a network call.
  confirm(_lockId: string, _orderId: string): Promise<ApiResult<{ confirmed: boolean }>> {
    return Promise.resolve({ ok: true, data: { confirmed: true } });
  },
};

// ── Order Types ────────────────────────────────────────────────────────────

export interface OrderLineItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lockId?: string;
  // Present on order-detail responses (order-service serializes the full item row).
  // `id` IS the orderItemId required to request a return on this line.
  id?: string;
  name?: string;
  sku?: string;
  variantName?: string;
  price?: number;
  total?: number;
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
  // 5-market context (audit metadata; line money stays server-authoritative).
  country?: string;
  market?: string;
  taxType?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

/** Settlement gateway slug persisted on the order/payment (C1). The provider stays the existing
 *  mock in non-production; the selected gateway is still recorded. */
export type PaymentGatewaySlug = 'stripe' | 'razorpay' | 'payu' | 'bank';

export interface PaymentIntent {
  intentId: string;
  status: string;
  /** Present for gateway providers (Razorpay) — the client opens the provider checkout with these.
   *  Absent for the mock provider, which is the branch signal to auto-confirm server-side. */
  keyId?: string;
  amount?: number;   // minor units (paise) from the provider
  currency?: string;
  /** Bank transfer / concierge: wire instructions to show the shopper. Order is placed + reserved,
   *  payment stays PENDING until finance confirms the transfer out-of-band (never auto-captured). */
  instructions?: string;
  /** Stripe (hosted Checkout): redirect the shopper here; on return we confirm against Stripe. */
  redirectUrl?: string;
  /** Stripe (Elements path, if ever used) — the PaymentIntent client secret. */
  clientSecret?: string;
  /** Stripe publishable key, when surfaced for a client-side SDK. */
  publishableKey?: string;
  /** PayU (international cards): a signed form the browser POSTs to PayU's hosted page. On return,
   *  PayU posts the result to the order-service return route, which verifies the hash and settles. */
  formPost?: { action: string; fields: Record<string, string> };
}
/** Razorpay Checkout handler result, verified SERVER-SIDE (HMAC) on confirm. */
export interface RazorpayVerification {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/** Mirrors order-service's raw model.toJSON() (orders_orders). Money lives in `totalAmount`
 *  (currency `currencyCode`); ownership is `customerId` → customer.userId (no top-level userId).
 *  paymentStatus is the full backend enum. `total`/`currency` are NOT returned by the backend. */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderPaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'voided'
  | 'failed';

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string | null;
  items: OrderLineItem[];
  currencyCode: string;
  country?: string;
  /** Persisted market column (us|uk|ae|in|sg) — group/report by this, not shipping country. */
  market?: string;
  subtotal: number;
  taxAmount: number;
  taxInclusive?: boolean;
  discountAmount?: number;
  shippingAmount?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  /** Recorded settlement gateway (C1) — present once a payment intent/confirm carries one. */
  gateway?: PaymentGatewaySlug | string | null;
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

export type OrderFulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned';

/**
 * PUBLIC guest order-tracking projection (order-service POST /orders/lookup). PII-minimised by
 * design: order state, totals, line items, and a COARSE destination (city/country) only — never the
 * full street address, phone, contact email, customer id, or internal metadata.
 */
export interface OrderTrackingView {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  currencyCode: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  placedAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  shipTo: { city: string | null; countryCode: string | null };
  items: Array<{
    name: string;
    variantName?: string | null;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  /** Customer-shareable parcel tracking (carrier + number + latest event). null until shipped. */
  shipment: {
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    estimatedDelivery: string | null;
    lastUpdate: { status: string; message: string | null; location: string | null; at: string } | null;
  } | null;
}

// ── Shipment / tracking (order-service orders_shipments) ──────────────────────
export interface ShipmentEvent {
  status: string;
  message?: string | null;
  location?: string | null;
  at: string;
}
export interface Shipment {
  id: string;
  orderId: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  events: ShipmentEvent[];
  createdAt: string;
  updatedAt: string;
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

  // PUBLIC guest order tracking: look up an order by the email used at checkout + the order number
  // on the confirmation. No auth or guest session required (order-service POST /orders/lookup); a
  // wrong email or unknown number returns a uniform 404. Returns a PII-minimised tracking view.
  lookup(email: string, orderNumber: string): Promise<ApiResult<OrderTrackingView>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<OrderTrackingView>();
    return apiFetch<OrderTrackingView>(`${ORDER_URL}/orders/stores/${storeId}/orders/lookup`, {
      method: 'POST',
      body: JSON.stringify({ email, orderNumber }),
    });
  },

  // Payment: create a provider intent, then confirm it (backend-authoritative capture —
  // a client can never mark itself paid). Mock provider in non-prod; real adapters when configured.
  // `gateway` (stripe|razorpay|payu|bank) is persisted on the order/payment per C1 — non-prod stays
  // mocked but records the choice.
  createPaymentIntent(orderId: string, gateway?: PaymentGatewaySlug): Promise<ApiResult<PaymentIntent>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaymentIntent>();
    return apiFetch<PaymentIntent>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/payments/intent`, {
      method: 'POST',
      body: JSON.stringify(gateway ? { gateway } : {}),
    });
  },

  // For the mock provider, send only { intentId } (server captures). For Razorpay, pass the
  // Checkout handler result as `verification` — the server verifies the HMAC signature before capture.
  // C1: confirmPayment returns the FULL updated Order (top-level id + paymentStatus). A confirmation
  // is PAID iff response.paymentStatus === 'paid' — there is NO 'captured' field or separate envelope.
  confirmPayment(
    orderId: string,
    intentId: string,
    opts: { verification?: RazorpayVerification; gateway?: PaymentGatewaySlug } = {},
  ): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    const body: Record<string, unknown> = { intentId };
    if (opts.verification) body.verification = opts.verification;
    if (opts.gateway) body.gateway = opts.gateway;
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/payments/confirm`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
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

  // Customer-facing: the authenticated shopper's OWN orders (order-service GET /orders/mine).
  // Unlike list() (store-admin scoped), this requires only a logged-in user.
  mine(filters: { page?: number; pageSize?: number } = {}): Promise<ApiResult<PaginatedResponse<Order>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<Order>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Order>>(`${ORDER_URL}/orders/stores/${storeId}/orders/mine${qs ? `?${qs}` : ''}`);
  },

  // Customer-readable shipment/tracking timeline for one of the shopper's orders.
  // Ownership is enforced server-side (owner OR guest-session OR staff) — never trust the client.
  shipments(orderId: string): Promise<ApiResult<Shipment[]>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Shipment[]>();
    return apiFetch<Shipment[]>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/shipments`);
  },

  cancel(orderId: string, reason?: string): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ADMIN/OPS: advance an order's fulfillment status. Requires an ops_manager store role
  // (enforced server-side). Status enum mirrors order-service updateOrderStatusSchema.
  updateStatus(orderId: string, status: OrderStatus): Promise<ApiResult<Order>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Order>();
    return apiFetch<Order>(`${ORDER_URL}/orders/stores/${storeId}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getByUser(userId: string, page = 1, pageSize = 20): Promise<ApiResult<PaginatedResponse<Order>>> {
    return orderApi.list({ userId, page, pageSize });
  },
};

// ── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  userId?: number | null;
  storeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// customerApi (store-scoped: /orders/stores/:storeId/customers)
export const customerApi = {
  /**
   * Find-or-create the AUTHENTICATED caller's customer record. The backend upsert is
   * idempotent by (store, email) and stamps `userId` SERVER-SIDE from the bearer token
   * (never trusted from the client). Returns the canonical customer — its UUID `id` is
   * what links an order to the shopper (so it surfaces in GET /orders/mine).
   */
  ensure(input: { email: string; firstName: string; lastName: string; phone?: string }): Promise<ApiResult<Customer>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Customer>();
    return apiFetch<Customer>(`${ORDER_URL}/orders/stores/${storeId}/customers`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

// ── Saved addresses (order-service orders_addresses, /me self-resolved) ───────
// Every route resolves the customer SERVER-SIDE from the bearer token — the client
// never supplies a customerId, so there is no IDOR surface.
export interface SavedAddress {
  id: string;
  addressType: 'shipping' | 'billing' | 'both';
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state?: string | null;
  zip?: string | null;
  countryCode: string;
  phone?: string | null;
  isDefault: boolean;
}
export type AddressInput = Omit<SavedAddress, 'id' | 'isDefault'> & { isDefault?: boolean };

export const addressApi = {
  listMine(): Promise<ApiResult<SavedAddress[]>> {
    const s = getStoreId();
    if (!s) return missingStore<SavedAddress[]>();
    return apiFetch<SavedAddress[]>(`${ORDER_URL}/orders/stores/${s}/customers/me/addresses`);
  },
  create(body: AddressInput): Promise<ApiResult<SavedAddress>> {
    const s = getStoreId();
    if (!s) return missingStore<SavedAddress>();
    return apiFetch<SavedAddress>(`${ORDER_URL}/orders/stores/${s}/customers/me/addresses`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Partial<AddressInput>): Promise<ApiResult<SavedAddress>> {
    const s = getStoreId();
    if (!s) return missingStore<SavedAddress>();
    return apiFetch<SavedAddress>(`${ORDER_URL}/orders/stores/${s}/customers/me/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<ApiResult<null>> {
    const s = getStoreId();
    if (!s) return missingStore<null>();
    return apiFetch<null>(`${ORDER_URL}/orders/stores/${s}/customers/me/addresses/${id}`, { method: 'DELETE' });
  },
};

// ── Returns / RMA (order-service orders_returns) ──────────────────────────────
export interface ReturnItemInput {
  orderItemId: string;
  quantity: number;
  reason?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
}
export interface CreateReturnPayload {
  orderId: string;
  reason: string;
  notes?: string;
  items: ReturnItemInput[];
}
export interface ReturnRecordItem {
  id: string;
  orderItemId: string;
  quantity: number;
  reason?: string | null;
  condition: string;
  refundAmount: string | number;
}
export interface ReturnRecord {
  id: string;
  orderId: string;
  returnNumber: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'closed';
  reason: string;
  notes?: string | null;
  totalRefund: string | number;
  refundMethod?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ReturnRecordItem[];
}

export const returnApi = {
  // The authenticated shopper requests a return on an order they own (server-enforced ownership;
  // only delivered/shipped orders are eligible).
  create(payload: CreateReturnPayload): Promise<ApiResult<ReturnRecord>> {
    const s = getStoreId();
    if (!s) return missingStore<ReturnRecord>();
    return apiFetch<ReturnRecord>(`${ORDER_URL}/orders/stores/${s}/returns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  // The shopper's OWN returns (scoped to their customer ids by userId — never store-wide).
  mine(filters: { page?: number; pageSize?: number; status?: ReturnRecord['status'] } = {}): Promise<ApiResult<PaginatedResponse<ReturnRecord>>> {
    const s = getStoreId();
    if (!s) return missingStore<PaginatedResponse<ReturnRecord>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<ReturnRecord>>(`${ORDER_URL}/orders/stores/${s}/returns/mine${qs ? `?${qs}` : ''}`);
  },
};

// ── Product reviews (commerce-service; authed write — public read is in catalog.ts) ──
export interface ProductReview {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author: string;
  isVerifiedPurchase: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reply?: string | null;
  replyAt?: string | null;
}

export const reviewApi = {
  // Submit (or update) the signed-in shopper's review for a product. `isVerifiedPurchase`
  // is computed server-side against paid orders — never sent by the client.
  submit(productId: string, body: { rating: number; title?: string; body?: string }): Promise<ApiResult<ProductReview>> {
    const s = getStoreId();
    if (!s) return missingStore<ProductReview>();
    return apiFetch<ProductReview>(`${COMMERCE_URL}/commerce/stores/${s}/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  // The caller's existing review for a product (for prefill/edit), or null.
  mine(productId: string): Promise<ApiResult<ProductReview | null>> {
    const s = getStoreId();
    if (!s) return missingStore<ProductReview | null>();
    return apiFetch<ProductReview | null>(`${COMMERCE_URL}/commerce/stores/${s}/products/${productId}/reviews/mine`);
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
  /** Signed guest session returned by cart-create (only for anonymous shoppers). */
  sessionToken?: string;
}

// ── cartApi (store-scoped, CART-ID keyed: /orders/stores/:storeId/carts) ──────
// Fully backed by order-service. Cart identity is the server cartId (NOT userId);
// callers obtain/persist it via src/lib/cart-session.ts (createCart → store cartId).

export interface CreateCartPayload { currencyCode?: string; customerId?: string; sessionId?: string; }
export interface CartItemInput { productId: string; variantId: string; quantity: number; }

export const cartApi = {
  async create(payload: CreateCartPayload = {}): Promise<ApiResult<Cart>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Cart>();
    const res = await apiFetch<Cart>(`${ORDER_URL}/orders/stores/${storeId}/carts`, {
      method: 'POST',
      body: JSON.stringify({ currencyCode: 'USD', ...payload }),
    });
    // Persist the signed guest session so subsequent order/payment calls are recognised as the owner.
    if (res.ok && res.data?.sessionToken) setCartSessionToken(res.data.sessionToken);
    return res;
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

// ── searchApi — backed by commerce-service product listing (?search= ILIKE on name/sku) ──────
export const searchApi = {
  async semantic(payload: SearchPayload): Promise<ApiResult<SearchResult>> {
    const filters: ProductFilters = {
      ...(payload.filters || {}),
      search: payload.query,
      status: 'published',
      ...(payload.page ? { page: payload.page } : {}),
      ...(payload.pageSize ? { limit: payload.pageSize } : {}),
    };
    const res = await productApi.list(filters);
    if (!res.ok) return res as ApiResult<SearchResult>;
    const products = res.data.items || [];
    return {
      ok: true,
      data: {
        products,
        total: res.data.total ?? products.length,
        query: payload.query,
        suggestions: products.slice(0, 5).map((p) => p.name).filter(Boolean),
      },
    };
  },
  async autocomplete(query: string): Promise<ApiResult<string[]>> {
    if (!query.trim()) return { ok: true, data: [] };
    const res = await productApi.list({ search: query, status: 'published', limit: 8 });
    if (!res.ok) return res as ApiResult<string[]>;
    return { ok: true, data: (res.data.items || []).map((p) => p.name).filter(Boolean).slice(0, 8) };
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

// ── analyticsApi — backed by order-service store-scoped analytics (/analytics/*) ──────────────
const analyticsQs = (filters: AnalyticsFilters, extra: Record<string, string | number | undefined> = {}) => {
  const p = new URLSearchParams();
  if (filters.from) p.set('from', filters.from);
  if (filters.to) p.set('to', filters.to);
  if (filters.country) p.set('country', filters.country);
  Object.entries(extra).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
export const analyticsApi = {
  summary(filters: AnalyticsFilters): Promise<ApiResult<AnalyticsSummary>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<AnalyticsSummary>();
    return apiFetch<AnalyticsSummary>(`${ORDER_URL}/orders/stores/${storeId}/analytics/summary${analyticsQs(filters)}`);
  },
  topProducts(filters: AnalyticsFilters, limit = 10): Promise<ApiResult<TopProduct[]>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<TopProduct[]>();
    return apiFetch<TopProduct[]>(`${ORDER_URL}/orders/stores/${storeId}/analytics/top-products${analyticsQs(filters, { limit })}`);
  },
  salesByCountry(filters: AnalyticsFilters): Promise<ApiResult<Record<string, number>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Record<string, number>>();
    return apiFetch<Record<string, number>>(`${ORDER_URL}/orders/stores/${storeId}/analytics/by-country${analyticsQs(filters)}`);
  },
  revenueTimeSeries(
    filters: AnalyticsFilters,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<ApiResult<{ date: string; revenue: number }[]>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<{ date: string; revenue: number }[]>();
    return apiFetch<{ date: string; revenue: number }[]>(`${ORDER_URL}/orders/stores/${storeId}/analytics/revenue${analyticsQs(filters, { granularity })}`);
  },
};

// ── Consignment Types & API ──────────────────────────────────────────────────
// Resale/consignment intake, my-consignments, single lookup, public certificate
// verification, and the authenticated seller profile. Backed by order-service,
// store-scoped: /consignments/stores/:storeId/...

/** A single consigned item in a submit payload. */
export interface ConsignmentItemInput {
  brand: string;
  model?: string;
  category?: string;
  color?: string;
  material?: string;
  conditionGrade?: 'pristine' | 'excellent' | 'very_good' | 'good' | 'fair';
  askingPrice?: number;
  currency?: string;
  description?: string;
  photoUrls?: string[];
  accessories?: string[];
  serialNumber?: string;
}

/** Submit body for a new consignment request (guest-capable). */
export interface ConsignmentSubmitPayload {
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  items: ConsignmentItemInput[];
}

const CONSIGNMENT_BASE = `${ORDER_URL}/consignments/stores`;

export const consignmentApi = {
  // Submit a consignment request. Guest-capable (no auth required); the server stamps the
  // owner from the bearer token when one is present, else binds to the contact email.
  submit(payload: ConsignmentSubmitPayload): Promise<ApiResult<Consignment>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Consignment>();
    return apiFetch<Consignment>(`${CONSIGNMENT_BASE}/${storeId}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // The authenticated seller's own consignment requests (paginated).
  listMine(
    filters: { page?: number; pageSize?: number } = {},
  ): Promise<ApiResult<PaginatedResponse<Consignment>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<Consignment>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Consignment>>(`${CONSIGNMENT_BASE}/${storeId}/requests/mine${qs ? `?${qs}` : ''}`);
  },

  // A single consignment request (owner-or-staff; ownership enforced server-side).
  get(id: string): Promise<ApiResult<Consignment>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Consignment>();
    return apiFetch<Consignment>(`${CONSIGNMENT_BASE}/${storeId}/requests/${id}`);
  },

  // PUBLIC: verify a certificate of authenticity by its printed code (no auth).
  verifyCertificate(code: string): Promise<ApiResult<CertificateVerification>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<CertificateVerification>();
    return apiFetch<CertificateVerification>(
      `${CONSIGNMENT_BASE}/${storeId}/certificates/${encodeURIComponent(code)}/verify`,
    );
  },

  // The authenticated seller's profile.
  getSellerProfile(): Promise<ApiResult<SellerProfile>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<SellerProfile>();
    return apiFetch<SellerProfile>(`${CONSIGNMENT_BASE}/${storeId}/sellers/me`);
  },

  updateSellerProfile(patch: Partial<SellerProfile>): Promise<ApiResult<SellerProfile>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<SellerProfile>();
    return apiFetch<SellerProfile>(`${CONSIGNMENT_BASE}/${storeId}/sellers/me`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  },
};

// Re-export the shared consignment item shape for callers that build intake items.
export type { ConsignmentItem };

// ── wishlistApi (store-scoped: /wishlists/stores/:storeId, all auth) ──────────
// Server-persisted wishlist for an AUTHENTICATED shopper. The storefront keeps a
// localStorage wishlist as the GUEST fallback (see lib/store.tsx) and merges it into
// the server wishlist on login.

const WISHLIST_BASE = `${ORDER_URL}/wishlists/stores`;

export const wishlistApi = {
  getMine(): Promise<ApiResult<StoredWishlist>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StoredWishlist>();
    return apiFetch<StoredWishlist>(`${WISHLIST_BASE}/${storeId}/mine`);
  },

  addItem(productId: string, variantId?: string): Promise<ApiResult<StoredWishlist>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StoredWishlist>();
    const body: Record<string, unknown> = { productId };
    if (variantId) body.variantId = variantId;
    return apiFetch<StoredWishlist>(`${WISHLIST_BASE}/${storeId}/mine/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  removeItem(productId: string, variantId?: string): Promise<ApiResult<StoredWishlist>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StoredWishlist>();
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
    return apiFetch<StoredWishlist>(
      `${WISHLIST_BASE}/${storeId}/mine/items/${encodeURIComponent(productId)}${qs}`,
      { method: 'DELETE' },
    );
  },
};

// ── appointmentsApi (store-scoped: /appointments/stores/:storeId) ─────────────
// Showroom / virtual / in-home / phone appointment booking. Booking is guest-capable;
// listing the shopper's own appointments requires auth.

export interface AppointmentBookPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  type: StoreAppointmentType;
  /** ISO datetime string. */
  preferredAt: string;
  notes?: string;
}

const APPOINTMENTS_BASE = `${ORDER_URL}/appointments/stores`;

export const appointmentsApi = {
  // Book an appointment (guest-capable).
  book(payload: AppointmentBookPayload): Promise<ApiResult<StoreAppointment>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StoreAppointment>();
    return apiFetch<StoreAppointment>(`${APPOINTMENTS_BASE}/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // The authenticated shopper's own appointments (paginated).
  listMine(
    filters: { page?: number; pageSize?: number } = {},
  ): Promise<ApiResult<PaginatedResponse<StoreAppointment>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<StoreAppointment>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<StoreAppointment>>(`${APPOINTMENTS_BASE}/${storeId}/mine${qs ? `?${qs}` : ''}`);
  },
};

// ── ADMIN / STAFF surfaces ────────────────────────────────────────────────────
// The methods below require an authenticated STAFF token. They reuse apiFetch, so the
// in-memory bearer token (lib/auth) is attached automatically — exactly like the
// customer-facing methods above. The backend independently enforces staff membership
// (store-scoped); an under-privileged token surfaces as a 403 ApiError, never a fake success.

// ── consignmentAdminApi (store-scoped: /consignments/stores/:storeId) ─────────
// Staff ops queue: list every request, advance lifecycle status (with quote/payout terms),
// record a per-item authentication result, and issue a certificate of authenticity.

export type ConsignmentPayoutType = 'consignment' | 'buyout';
export type ConsignmentAuthStatus = 'pending' | 'in_review' | 'authenticated' | 'rejected';
export type ConsignmentAuthConfidence = 'high' | 'medium' | 'low';

export interface ConsignmentStatusUpdate {
  status: string;
  quoteAmount?: number;
  quoteCurrency?: string;
  payoutType?: ConsignmentPayoutType;
  commissionRate?: number;
  reviewerNotes?: string;
  listedProductId?: string;
}

export interface ConsignmentAuthenticationInput {
  status: ConsignmentAuthStatus;
  authenticatorName?: string;
  method?: string;
  findings?: string;
  confidence?: ConsignmentAuthConfidence;
  photoUrls?: string[];
}

export interface ConsignmentCertificateInput {
  issuerName?: string;
  serialNumber?: string;
  /** Accepted for forward-compat; current backend issueCertificateSchema ignores unknown keys. */
  conditionGrade?: string;
  productId?: string;
}

export interface ConsignmentAuthenticationRecord {
  id: string;
  requestId: string;
  itemId: string;
  status: ConsignmentAuthStatus;
  authenticatorName?: string | null;
  method?: string | null;
  findings?: string | null;
  confidence?: ConsignmentAuthConfidence | null;
  photoUrls?: string[];
  createdAt?: string;
}

export interface ConsignmentCertificate {
  id: string;
  code: string;
  requestId: string;
  itemId: string;
  serialNumber?: string | null;
  conditionGrade?: string | null;
  productId?: string | null;
  issuedAt?: string;
}

const CONSIGNMENT_ADMIN_BASE = `${ORDER_URL}/consignments/stores`;

export const consignmentAdminApi = {
  // Every consignment request for the store (staff-scoped), optionally filtered by status.
  list(
    filters: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResult<PaginatedResponse<Consignment>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<Consignment>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params.set(k, String(v)); });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Consignment>>(
      `${CONSIGNMENT_ADMIN_BASE}/${storeId}/requests${qs ? `?${qs}` : ''}`,
    );
  },

  // Advance a request's lifecycle (quote → accept → received → authenticating → listed → sold).
  // Optional quote/payout/commission terms are carried on the same transition.
  updateStatus(id: string, body: ConsignmentStatusUpdate): Promise<ApiResult<Consignment>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<Consignment>();
    return apiFetch<Consignment>(`${CONSIGNMENT_ADMIN_BASE}/${storeId}/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Record an authentication result for a single consigned item.
  recordAuthentication(
    requestId: string,
    itemId: string,
    body: ConsignmentAuthenticationInput,
  ): Promise<ApiResult<ConsignmentAuthenticationRecord>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<ConsignmentAuthenticationRecord>();
    return apiFetch<ConsignmentAuthenticationRecord>(
      `${CONSIGNMENT_ADMIN_BASE}/${storeId}/requests/${requestId}/items/${itemId}/authentication`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  // Issue a Certificate of Authenticity for an authenticated item.
  issueCertificate(
    requestId: string,
    itemId: string,
    body: ConsignmentCertificateInput = {},
  ): Promise<ApiResult<ConsignmentCertificate>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<ConsignmentCertificate>();
    return apiFetch<ConsignmentCertificate>(
      `${CONSIGNMENT_ADMIN_BASE}/${storeId}/requests/${requestId}/items/${itemId}/certificate`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },
};

// ── appointmentsAdminApi (store-scoped: /appointments/stores/:storeId) ────────
// Staff ops queue for showroom/virtual/in-home/phone appointments.

export type AppointmentAdminStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

const APPOINTMENTS_ADMIN_BASE = `${ORDER_URL}/appointments/stores`;

export const appointmentsAdminApi = {
  // Every appointment for the store (staff-scoped), optionally filtered by status.
  list(
    filters: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResult<PaginatedResponse<StoreAppointment>>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<PaginatedResponse<StoreAppointment>>();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params.set(k, String(v)); });
    const qs = params.toString();
    return apiFetch<PaginatedResponse<StoreAppointment>>(
      `${APPOINTMENTS_ADMIN_BASE}/${storeId}${qs ? `?${qs}` : ''}`,
    );
  },

  // Confirm / cancel / complete / mark no-show.
  updateStatus(id: string, body: { status: AppointmentAdminStatus }): Promise<ApiResult<StoreAppointment>> {
    const storeId = getStoreId();
    if (!storeId) return missingStore<StoreAppointment>();
    return apiFetch<StoreAppointment>(`${APPOINTMENTS_ADMIN_BASE}/${storeId}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
