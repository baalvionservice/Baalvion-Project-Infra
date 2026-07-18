// Real order-service cart integration — replaces the no-op "Added to Cart" toasts that used to
// stand in for cart state everywhere in this app. Every call goes through the same-origin
// /api/order-proxy/* bridge (see src/app/api/order-proxy/[...path]/route.ts), mirroring
// lib/api/community.ts's proxy convention. Guest carts are bound to a signed session token
// (never a raw session id) — see order-service/service/cartService.js — persisted here in
// localStorage and sent back as the X-Cart-Session header the proxy now forwards untouched.

const PROXY_BASE = '/api/order-proxy';
const SESSION_TOKEN_KEY = 'mu_cart_session_token';

export interface CartItem {
  productId: string | null;
  variantId: string | null;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  metadata: Record<string, unknown>;
}

export interface Cart {
  id: string;
  storeId: string;
  customerId: string | null;
  userId: number | null;
  items: CartItem[];
  currencyCode: string;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  totalAmount: number;
  expiresAt: string;
  sessionToken?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SESSION_TOKEN_KEY);
}

function storeSessionToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_TOKEN_KEY, token);
}

async function cartFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const token = getSessionToken();
  if (token) headers.set('x-cart-session', token);
  const res = await fetch(`${PROXY_BASE}${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `cart API ${path} failed: ${res.status}`);
  }
  return body.data;
}

export async function createCart(storeId: string, currencyCode = 'USD'): Promise<Cart> {
  const cart = await cartFetch<Cart>(`/stores/${storeId}/carts`, { method: 'POST', body: JSON.stringify({ currencyCode }) });
  if (cart.sessionToken) storeSessionToken(cart.sessionToken);
  return cart;
}

export async function getCart(storeId: string, cartId: string): Promise<Cart> {
  return cartFetch<Cart>(`/stores/${storeId}/carts/${cartId}`);
}

export async function addCartItem(storeId: string, cartId: string, item: Omit<CartItem, 'metadata'> & { metadata?: Record<string, unknown> }): Promise<Cart> {
  return cartFetch<Cart>(`/stores/${storeId}/carts/${cartId}/items`, { method: 'POST', body: JSON.stringify(item) });
}

export async function updateCartItem(storeId: string, cartId: string, key: { variantId?: string | null; productId?: string | null }, quantity: number): Promise<Cart> {
  return cartFetch<Cart>(`/stores/${storeId}/carts/${cartId}/items`, { method: 'PATCH', body: JSON.stringify({ ...key, quantity }) });
}

export async function removeCartItem(storeId: string, cartId: string, key: { variantId?: string | null; productId?: string | null }): Promise<void> {
  const params = new URLSearchParams();
  if (key.variantId) params.set('variantId', key.variantId);
  if (key.productId) params.set('productId', key.productId);
  await cartFetch<null>(`/stores/${storeId}/carts/${cartId}/items?${params.toString()}`, { method: 'DELETE' });
}

export async function clearCart(storeId: string, cartId: string): Promise<void> {
  await cartFetch<null>(`/stores/${storeId}/carts/${cartId}`, { method: 'DELETE' });
}

export async function claimCart(storeId: string, cartId: string, targetCartId?: string): Promise<Cart> {
  return cartFetch<Cart>(`/stores/${storeId}/carts/${cartId}/claim`, { method: 'POST', body: JSON.stringify({ targetCartId }) });
}

// ── Admin cart visibility (cross-store — see order-service/routes/adminCartRoutes.js) ───────────

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

async function cartFetchPaginated<T>(path: string): Promise<PaginatedResult<T>> {
  const headers = new Headers();
  const token = getSessionToken();
  if (token) headers.set('x-cart-session', token);
  const res = await fetch(`${PROXY_BASE}${path}`, { headers, credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T[]> & { pagination?: Pagination };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `cart API ${path} failed: ${res.status}`);
  }
  return { items: body.data, pagination: body.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false } };
}

export interface AdminCartRow extends Omit<Cart, 'sessionToken'> {
  createdAt: string;
  updatedAt: string;
}

export async function listLiveCarts(opts: { storeId?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<AdminCartRow>> {
  const params = new URLSearchParams();
  if (opts.storeId) params.set('storeId', opts.storeId);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return cartFetchPaginated<AdminCartRow>(`/admin/carts${qs ? `?${qs}` : ''}`);
}

export async function listAbandonedCarts(opts: { storeId?: string; abandonedAfterMinutes?: number; page?: number; limit?: number } = {}): Promise<PaginatedResult<AdminCartRow>> {
  const params = new URLSearchParams();
  if (opts.storeId) params.set('storeId', opts.storeId);
  if (opts.abandonedAfterMinutes) params.set('abandonedAfterMinutes', String(opts.abandonedAfterMinutes));
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return cartFetchPaginated<AdminCartRow>(`/admin/carts/abandoned${qs ? `?${qs}` : ''}`);
}

export interface CartEventRow {
  id: string;
  cartId: string;
  storeId: string;
  userId: number | null;
  eventType: 'item_added' | 'item_updated' | 'item_removed' | 'cart_cleared' | 'cart_claimed';
  itemSnapshot: CartItem | null;
  cartSnapshot: { itemCount: number; subtotal: number; totalAmount: number; currencyCode: string };
  occurredAt: string;
}

export async function getUserCartHistory(userId: string, opts: { page?: number; limit?: number } = {}): Promise<PaginatedResult<CartEventRow>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return cartFetchPaginated<CartEventRow>(`/admin/carts/users/${userId}/history${qs ? `?${qs}` : ''}`);
}
