// Real order-service order/payment integration. Every call goes through the same-origin
// /api/order-proxy/* bridge (see src/app/api/order-proxy/[...path]/route.ts) and, for guest
// checkout, the same signed X-Cart-Session token cart.ts already stores — order-service binds a
// guest order to that session (createOrder throws 401 without it for an unauthenticated caller).
import { getSessionToken } from './cart';

const PROXY_BASE = '/api/order-proxy';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export interface OrderAddressInput {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip?: string;
  countryCode: string;
  phone?: string;
  email?: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderPayment {
  id: string;
  provider: string;
  status: string;
  transactionId: string | null;
  amount: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'failed';
  currencyCode: string;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  discountCode: string | null;
  shippingAddress: OrderAddressInput | null;
  billingAddress: OrderAddressInput | null;
  items: OrderItem[];
  payments: OrderPayment[];
  createdAt: string;
}

export interface CreateOrderInput {
  items: { productId?: string | null; variantId?: string | null; sku?: string; name?: string; quantity: number }[];
  currencyCode: string;
  discountCode?: string | null;
  billingAddress?: OrderAddressInput | null;
  shippingAddress?: OrderAddressInput | null;
  idempotencyKey?: string;
  // returnUrl (this storefront's own checkout page origin) lets redirect-based gateways
  // (Stripe/PayU) bounce the shopper back HERE instead of a different Baalvion site's checkout —
  // see order-service's paymentProvider.js/payuReturnRoutes.js for how it's consumed.
  metadata?: { returnUrl?: string };
}

export interface PaymentIntent {
  intentId: string;
  status: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  redirectUrl?: string;
  wallets?: Record<string, string>;
  instructions?: string;
  formPost?: { action: string; fields: Record<string, string> };
}

export interface RazorpayVerification {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

async function orderFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const token = getSessionToken();
  if (token) headers.set('x-cart-session', token);
  const res = await fetch(`${PROXY_BASE}${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `order API ${path} failed: ${res.status}`);
  }
  return body.data;
}

export async function createOrder(storeId: string, body: CreateOrderInput): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders`, { method: 'POST', body: JSON.stringify(body) });
}

export async function getOrder(storeId: string, orderId: string): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}`);
}

export async function listMyOrders(storeId: string): Promise<Order[]> {
  return orderFetch<Order[]>(`/stores/${storeId}/orders/mine`);
}

export async function createPaymentIntent(storeId: string, orderId: string, gateway?: 'stripe' | 'razorpay' | 'payu' | 'bank' | 'crypto'): Promise<PaymentIntent> {
  return orderFetch<PaymentIntent>(`/stores/${storeId}/orders/${orderId}/payments/intent`, {
    method: 'POST',
    body: JSON.stringify(gateway ? { gateway } : {}),
  });
}

export async function confirmPayment(storeId: string, orderId: string, body: { intentId: string; verification?: RazorpayVerification; gateway?: string }): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}/payments/confirm`, { method: 'POST', body: JSON.stringify(body) });
}

export async function lookupOrder(storeId: string, email: string, orderNumber: string): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/lookup`, { method: 'POST', body: JSON.stringify({ email, orderNumber }) });
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
interface PaginatedResult<T> { items: T[]; pagination: Pagination }

async function orderFetchPaginated<T>(path: string): Promise<PaginatedResult<T>> {
  const headers = new Headers();
  const token = getSessionToken();
  if (token) headers.set('x-cart-session', token);
  const res = await fetch(`${PROXY_BASE}${path}`, { headers, credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T[]> & { pagination?: Pagination };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `order API ${path} failed: ${res.status}`);
  }
  return { items: body.data, pagination: body.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false } };
}

// Store-scoped order queue (requires store_viewer+ role on storeId — sellers get this via
// ops_manager, granted on approval; see commerce-service's sellerApplicationService.js).
// NOTE: this is store-wide, not per-seller — Market Underworld's shared-catalog model means an
// order can contain another seller's products too. The seller order-fulfillment page filters/
// highlights by product ownership client-side; true per-seller order isolation would require
// splitting orders by seller at checkout, which order-service does not do today.
export async function listStoreOrders(storeId: string, opts: { status?: string; page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResult<Order>> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.search) params.set('search', opts.search);
  const qs = params.toString();
  return orderFetchPaginated<Order>(`/stores/${storeId}/orders${qs ? `?${qs}` : ''}`);
}

export async function updateOrderStatus(storeId: string, orderId: string, status: Order['status']): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function cancelOrder(storeId: string, orderId: string, reason: string): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
}

// Manual settlement (bank transfer / crypto) — the ops-side counterpart to the buyer's "I've Sent
// the Payment" step: an admin/seller verifies the transfer out-of-band and records it here.
export async function recordPayment(storeId: string, orderId: string, body: { provider: string; transactionId?: string; amount: number; currencyCode: string; status: 'authorized' | 'captured' | 'refunded' | 'voided' | 'failed'; paidAt?: string }): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}/payments`, { method: 'POST', body: JSON.stringify(body) });
}

export async function refundOrder(storeId: string, orderId: string, body: { amount?: number; reason?: string } = {}): Promise<Order> {
  return orderFetch<Order>(`/stores/${storeId}/orders/${orderId}/refund`, { method: 'POST', body: JSON.stringify(body) });
}

export interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string | null;
  status: string;
  createdAt: string;
}

export async function listShipments(storeId: string, orderId: string): Promise<Shipment[]> {
  return orderFetch<Shipment[]>(`/stores/${storeId}/orders/${orderId}/shipments`);
}

export async function createShipment(storeId: string, orderId: string, body: { carrier: string; trackingNumber: string }): Promise<Shipment> {
  return orderFetch<Shipment>(`/stores/${storeId}/orders/${orderId}/shipments`, { method: 'POST', body: JSON.stringify(body) });
}

// ── Returns ───────────────────────────────────────────────────────────────────────────────────

export interface ReturnItem {
  orderItemId: string;
  quantity: number;
  reason?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  name?: string;
  variantName?: string | null;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  storeId: string;
  returnNumber: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'closed';
  reason: string;
  notes: string | null;
  currencyCode: string;
  totalRefund: string;
  items: ReturnItem[];
  createdAt: string;
}

export async function createReturn(storeId: string, body: { orderId: string; reason: string; notes?: string; items: { orderItemId: string; quantity: number; reason?: string; condition?: ReturnItem['condition'] }[] }): Promise<OrderReturn> {
  return orderFetch<OrderReturn>(`/stores/${storeId}/returns`, { method: 'POST', body: JSON.stringify(body) });
}

export async function listMyReturns(storeId: string): Promise<OrderReturn[]> {
  return orderFetch<OrderReturn[]>(`/stores/${storeId}/returns/mine`);
}

export async function listStoreReturns(storeId: string, opts: { status?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<OrderReturn>> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return orderFetchPaginated<OrderReturn>(`/stores/${storeId}/returns${qs ? `?${qs}` : ''}`);
}

export async function updateReturnStatus(storeId: string, returnId: string, status: OrderReturn['status']): Promise<OrderReturn> {
  return orderFetch<OrderReturn>(`/stores/${storeId}/returns/${returnId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

// ── Wishlist ──────────────────────────────────────────────────────────────────────────────────
// Mounted at /wishlists/stores/:storeId (a sibling tree to /orders/stores/:storeId — see
// order-service's routes/v1.js), reached through its own /api/wishlist-proxy bridge (see
// src/app/api/wishlist-proxy/[...path]/route.ts) since order-proxy's base already bakes in /orders.

const WISHLIST_PROXY_BASE = '/api/wishlist-proxy';

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId: string | null;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  storeId: string;
  userId: number;
  items: WishlistItem[];
}

async function wishlistFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const token = getSessionToken();
  if (token) headers.set('x-cart-session', token);
  const res = await fetch(`${WISHLIST_PROXY_BASE}${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `wishlist API ${path} failed: ${res.status}`);
  }
  return body.data;
}

export async function getMyWishlist(storeId: string): Promise<Wishlist> {
  return wishlistFetch<Wishlist>(`/stores/${storeId}/mine`);
}

export async function addToWishlist(storeId: string, productId: string, variantId?: string | null): Promise<Wishlist> {
  return wishlistFetch<Wishlist>(`/stores/${storeId}/mine/items`, { method: 'POST', body: JSON.stringify({ productId, variantId }) });
}

export async function removeFromWishlist(storeId: string, productId: string, variantId?: string | null): Promise<Wishlist> {
  const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
  return wishlistFetch<Wishlist>(`/stores/${storeId}/mine/items/${productId}${qs}`, { method: 'DELETE' });
}
