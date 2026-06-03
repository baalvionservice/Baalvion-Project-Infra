/**
 * Atomic checkout — creates a REAL backend order (no local state as source of truth,
 * no synthetic lock/risk/payment steps). The backend order API is items-based
 * (order-service createOrderSchema: items need only sku/name/quantity/price —
 * productId/variantId are optional), so this works against the live backend with a
 * seeded store, without a variant model in the UI.
 *
 * Flow: resolve store → validate non-empty → orderApi.create(items) → real Order | error.
 */
import { orderApi, customerApi, setCartSessionToken, type CreateOrderPayload, type Order, type ApiResult } from './api-client';
import { authClient, getAccessToken, getCurrentUser } from './auth';
import { getStoreId } from './store-context';
import { ensureCart, clearCartId } from './cart-session';
import { normalizeCountry, getCountryConfig } from './i18n/countries';

export interface CheckoutLine {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  productId?: string;
}

export interface PlaceOrderInput {
  lines: CheckoutLine[];
  currencyCode: string;
  /** Active market (us|uk|ae|in|sg) — attaches market + tax context to the order. */
  country?: string;
  shippingAmount?: number;
  shippingAddress?: Record<string, unknown>;
  /** An explicit customer UUID. When omitted, a signed-in shopper is auto-linked (see ensureMyCustomerId). */
  customerId?: string;
  /** Shipping/billing name from the checkout form — used to name the customer record on first link. */
  customer?: { firstName?: string; lastName?: string };
  idempotencyKey?: string;
  /** Run payment (intent → confirm) after creating the order. Default true. */
  pay?: boolean;
}

export interface PlaceOrderResult { order: Order; paid: boolean; }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Link an order to the signed-in shopper's customer record so it appears in their account
 * (GET /orders/mine). Restores the in-memory access token from the httpOnly refresh cookie
 * if it was lost on navigation, then upserts the caller's customer (idempotent by email;
 * `userId` is stamped SERVER-SIDE from the bearer token — never sent by the client). Returns
 * the customer UUID, or null for guests so anonymous checkout is unaffected.
 */
async function ensureMyCustomerId(form?: { firstName?: string; lastName?: string }): Promise<string | null> {
  if (!getAccessToken()) {
    await authClient.bootstrap();
  }
  const user = getCurrentUser();
  if (!getAccessToken() || !user?.email) return null; // not signed in → guest checkout

  const [firstFromName, ...restFromName] = (user.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = form?.firstName?.trim() || firstFromName || 'Maison';
  const lastName = form?.lastName?.trim() || restFromName.join(' ') || 'Client';

  const res = await customerApi.ensure({ email: user.email, firstName, lastName });
  return res.ok ? res.data.id : null;
}

export async function placeOrder(input: PlaceOrderInput): Promise<ApiResult<PlaceOrderResult>> {
  if (!getStoreId()) {
    return { ok: false, error: { message: 'STORE_CONTEXT_MISSING: set NEXT_PUBLIC_STORE_ID', code: 400 } };
  }
  if (!input.lines.length) {
    return { ok: false, error: { message: 'Cart is empty', code: 400 } };
  }

  // Guest checkout requires a signed cart session; ensureCart creates the backend cart and
  // captures its X-Cart-Session (no-op / userId-bound for authenticated shoppers). Without it,
  // order creation is rejected 401 by order-service.
  const ensured = await ensureCart(input.currencyCode);
  if (!ensured.ok) {
    return { ok: false, error: { message: `Could not start a checkout session: ${ensured.error}`, code: 400 } };
  }

  // Send ONLY product refs + quantity. The backend re-derives sku/name/price + tax from
  // commerce data and recomputes ALL totals — no authoritative monetary fields are sent.
  const items = input.lines.map((l) => ({
    quantity: l.quantity,
    ...(l.productId && UUID_RE.test(l.productId) ? { productId: l.productId } : {}),
  }));

  const cc = input.country ? normalizeCountry(input.country) : undefined;
  const market = cc ? getCountryConfig(cc) : undefined;

  // Resolve the customer link: an explicit valid UUID wins; otherwise, if the shopper is
  // signed in, ensure their customer record and link the order to it. Guests stay anonymous
  // (null), so this never blocks or changes guest checkout.
  let customerId =
    input.customerId && UUID_RE.test(input.customerId) ? input.customerId : undefined;
  if (!customerId) {
    customerId = (await ensureMyCustomerId(input.customer)) ?? undefined;
  }

  const payload: CreateOrderPayload = {
    currencyCode: input.currencyCode,
    items,
    shippingAmount: input.shippingAmount ?? 0,
    ...(cc && market
      ? {
          country: cc,
          market: cc,
          taxType: market.taxType,
          taxRate: market.taxRate,
          // VAT/GST markets are tax-inclusive; US sales tax is added on top.
          taxInclusive: cc !== 'us',
        }
      : {}),
    ...(input.shippingAddress ? { shippingAddress: input.shippingAddress } : {}),
    ...(customerId ? { customerId } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
  };

  const created = await orderApi.create(payload);
  if (!created.ok) return created;
  const order = created.data;

  // Complete payment (intent → confirm). Non-fatal: the order exists regardless; a payment
  // failure simply leaves it unpaid for ops follow-up (never a fake "paid" confirmation).
  let paid = false;
  if (input.pay !== false) {
    try {
      const intent = await orderApi.createPaymentIntent(order.id);
      if (intent.ok && intent.data?.intentId) {
        const confirmed = await orderApi.confirmPayment(order.id, intent.data.intentId);
        paid = confirmed.ok && confirmed.data?.status === 'captured';
      }
    } catch { /* leave unpaid; order already created */ }
  }

  // This cart/session is now consumed → start the next checkout fresh.
  clearCartId();
  setCartSessionToken(null);

  return { ok: true, data: { order, paid } };
}
