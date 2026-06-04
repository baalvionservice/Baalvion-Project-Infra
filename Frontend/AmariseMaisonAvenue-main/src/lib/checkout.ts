/**
 * Atomic checkout — creates a REAL backend order (no local state as source of truth,
 * no synthetic lock/risk/payment steps). The backend order API is items-based
 * (order-service createOrderSchema: items need only sku/name/quantity/price —
 * productId/variantId are optional), so this works against the live backend with a
 * seeded store, without a variant model in the UI.
 *
 * Flow: resolve store → validate non-empty → orderApi.create(items) → real Order | error.
 */
import { orderApi, customerApi, setCartSessionToken, type CreateOrderPayload, type Order, type ApiResult, type PaymentIntent, type PaymentGatewaySlug } from './api-client';
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

/** Live per-market tax facts (sourced from GET /commerce/markets via the store), overriding the
 *  static FE copy so a backend rate change is reflected without a code change. */
export interface MarketTaxContext {
  taxType?: string;
  taxRate?: number;
  taxInclusive?: boolean;
}

export interface PlaceOrderInput {
  lines: CheckoutLine[];
  currencyCode: string;
  /** Active market (us|uk|ae|in|sg) — attaches market + tax context to the order. */
  country?: string;
  /** Live market tax facts from the markets registry; falls back to the static config when absent. */
  taxContext?: MarketTaxContext;
  shippingAmount?: number;
  shippingAddress?: Record<string, unknown>;
  /** An explicit customer UUID. When omitted, a signed-in shopper is auto-linked (see ensureMyCustomerId). */
  customerId?: string;
  /** Shipping/billing name from the checkout form — used to name the customer record on first link. */
  customer?: { firstName?: string; lastName?: string };
  idempotencyKey?: string;
  /** Chosen settlement gateway (stripe|razorpay|payu|bank). Recorded on the order/payment per C1. */
  gateway?: PaymentGatewaySlug;
  /** Run payment (intent → confirm) after creating the order. Default true. */
  pay?: boolean;
}

export interface PlaceOrderResult {
  order: Order;
  paid: boolean;
  /** Set for gateway providers (Razorpay): the order exists + a provider intent was created, but
   *  payment is NOT done — the page must open the provider checkout and confirm interactively. */
  intent?: PaymentIntent;
}

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

  // Tax facts: prefer the LIVE markets registry (input.taxContext, sourced from GET /commerce/markets)
  // so a backend rate change is honored without a code change; fall back to the static market config.
  const taxType = input.taxContext?.taxType ?? market?.taxType;
  const taxRate = input.taxContext?.taxRate ?? market?.taxRate;
  const taxInclusive =
    input.taxContext?.taxInclusive ?? (cc ? cc !== 'us' : undefined);

  const payload: CreateOrderPayload = {
    currencyCode: input.currencyCode,
    items,
    shippingAmount: input.shippingAmount ?? 0,
    ...(cc
      ? {
          country: cc,
          market: cc,
          ...(taxType ? { taxType } : {}),
          ...(taxRate != null ? { taxRate } : {}),
          ...(taxInclusive != null ? { taxInclusive } : {}),
        }
      : {}),
    ...(input.shippingAddress ? { shippingAddress: input.shippingAddress } : {}),
    ...(customerId ? { customerId } : {}),
    ...(input.gateway ? { metadata: { gateway: input.gateway } } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
  };

  const created = await orderApi.create(payload);
  if (!created.ok) return created;
  const order = created.data;

  // Create a payment intent. Two provider shapes:
  //  • mock (no keyId)   → auto-confirm server-side here (no user interaction), as before.
  //  • gateway/Razorpay  → return the intent to the page so it can open the provider checkout;
  //    DO NOT auto-confirm (the user must pay first, then the page confirms with the signed result).
  // Non-fatal throughout: the order exists regardless; a failure leaves it unpaid for follow-up
  // (never a fake "paid").
  let paid = false;
  let paidOrder: Order | undefined;
  let payIntent: PaymentIntent | undefined;
  if (input.pay !== false) {
    try {
      const intent = await orderApi.createPaymentIntent(order.id, input.gateway);
      if (intent.ok && intent.data?.intentId) {
        if (intent.data.keyId) {
          payIntent = intent.data; // gateway → defer to interactive checkout on the page
        } else {
          // C1: confirmPayment returns the full updated Order; PAID iff paymentStatus === 'paid'.
          const confirmed = await orderApi.confirmPayment(order.id, intent.data.intentId, {
            gateway: input.gateway,
          });
          if (confirmed.ok && confirmed.data?.paymentStatus === 'paid') {
            paid = true;
            paidOrder = confirmed.data;
          }
        }
      }
    } catch { /* leave unpaid; order already created */ }
  }

  // This cart/session is consumed once the order exists → start the next checkout fresh.
  // (Safe for the gateway path too: the order is already created; payment is tracked on the order.)
  clearCartId();
  setCartSessionToken(null);

  // Prefer the post-confirm order snapshot (real paymentStatus) when payment ran.
  return { ok: true, data: { order: paidOrder ?? order, paid, intent: payIntent } };
}
