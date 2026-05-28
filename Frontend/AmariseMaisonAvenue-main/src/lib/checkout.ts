/**
 * Atomic checkout — creates a REAL backend order (no local state as source of truth,
 * no synthetic lock/risk/payment steps). The backend order API is items-based
 * (order-service createOrderSchema: items need only sku/name/quantity/price —
 * productId/variantId are optional), so this works against the live backend with a
 * seeded store, without a variant model in the UI.
 *
 * Flow: resolve store → validate non-empty → orderApi.create(items) → real Order | error.
 */
import { orderApi, type CreateOrderPayload, type Order, type ApiResult } from './api-client';
import { getStoreId } from './store-context';

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
  shippingAmount?: number;
  shippingAddress?: Record<string, unknown>;
  customerId?: string;
  idempotencyKey?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function placeOrder(input: PlaceOrderInput): Promise<ApiResult<Order>> {
  if (!getStoreId()) {
    return { ok: false, error: { message: 'STORE_CONTEXT_MISSING: set NEXT_PUBLIC_STORE_ID', code: 400 } };
  }
  if (!input.lines.length) {
    return { ok: false, error: { message: 'Cart is empty', code: 400 } };
  }

  // Send ONLY product refs + quantity. The backend re-derives sku/name/price + tax from
  // commerce data and recomputes ALL totals — no authoritative monetary fields are sent.
  const items = input.lines.map((l) => ({
    quantity: l.quantity,
    ...(l.productId && UUID_RE.test(l.productId) ? { productId: l.productId } : {}),
  }));

  const payload: CreateOrderPayload = {
    currencyCode: input.currencyCode,
    items,
    shippingAmount: input.shippingAmount ?? 0,
    ...(input.shippingAddress ? { shippingAddress: input.shippingAddress } : {}),
    ...(input.customerId && UUID_RE.test(input.customerId) ? { customerId: input.customerId } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
  };

  return orderApi.create(payload);
}
