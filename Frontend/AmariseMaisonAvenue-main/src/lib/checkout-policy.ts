/**
 * CHECKOUT POLICY — Option B (CONTINUITY).
 *
 * The backend risk engine (/risk/evaluate) and atomic inventory-lock API are NOT
 * implemented. Decision: do NOT permanently block checkout for never-built backend
 * features. The flow proceeds, logging an explicit warning, while the EXISTING
 * client-side RiskEngine (src/lib/fraud/risk-engine.ts) continues advisory fraud
 * screening. Server-side risk + atomic reservation are tracked as follow-ups.
 *
 * Rationale: blocking all checkout (Option A) for a backend feature that was never
 * built — while a working client-side risk gate exists — would make a live store
 * unsellable. Continuity keeps core commerce functional with transparent logging.
 * Flip CHECKOUT_RISK_MODE to 'SAFE' to hard-block instead.
 *
 * Security caveat: client-side risk is advisory and bypassable; a server-side risk
 * gate is required before this can be considered a true fraud control.
 */
export type CheckoutMode = 'CONTINUITY' | 'SAFE';

export const CHECKOUT_RISK_MODE: CheckoutMode =
  (process.env.NEXT_PUBLIC_CHECKOUT_MODE as CheckoutMode) || 'CONTINUITY';

export type CheckoutDependency = 'inventoryLock' | 'fraudRisk' | 'preOrderPayment';

export interface CheckoutDecision {
  proceed: boolean;
  message: string;
}

/** Consistent decision for a missing checkout dependency across all checkout steps. */
export function onMissingCheckoutDependency(feature: CheckoutDependency): CheckoutDecision {
  if (CHECKOUT_RISK_MODE === 'SAFE') {
    const labels: Record<CheckoutDependency, string> = {
      inventoryLock: 'inventory reservation',
      fraudRisk: 'risk system',
      preOrderPayment: 'payment system',
    };
    return { proceed: false, message: `Checkout unavailable (${labels[feature]} offline).` };
  }
  // eslint-disable-next-line no-console
  console.warn(`[CHECKOUT][CONTINUITY] proceeding without ${feature} (backend not implemented)`);
  return { proceed: true, message: '' };
}

// ── Oversell guard: synchronous live stock re-check ──────────────────────────
// There is no atomic reservation/lock API (inventoryApi.lock returns 501). For this
// low-concurrency consignment catalog we close the pre-order window with a SYNCHRONOUS
// live availability re-check at checkout, against the catalog's server-computed `inStock`
// (commerce-service: trackInventory ? stockQuantity>0 : true). createOrder still atomically
// reserves at order time — this just hard-blocks an item the catalog already reports sold out,
// so two shoppers racing for the last unit don't both reach settlement on a stale page.

export interface CartStockLine {
  /** Catalog product id used to re-fetch live availability. */
  productId: string;
  name: string;
}

export interface StockRecheckResult {
  available: boolean;
  /** Names of items the live catalog now reports as sold out. */
  soldOut: string[];
}

/** A minimal product availability shape (subset of catalog Product). */
interface LiveAvailability {
  inStock?: boolean;
  stock?: number;
}

/**
 * Re-validate every cart line against live catalog availability. `fetchAvailability` returns the
 * live product (or null when it can't be resolved — treated as available to avoid false negatives).
 * An item is sold out only when the catalog explicitly reports inStock === false (or stock <= 0
 * for tracked items). Fail-open on fetch errors so a transient API blip never wrongly blocks a sale.
 */
export async function revalidateCartStock(
  lines: CartStockLine[],
  fetchAvailability: (productId: string) => Promise<LiveAvailability | null>,
): Promise<StockRecheckResult> {
  const soldOut: string[] = [];
  await Promise.all(
    lines.map(async (line) => {
      if (!line.productId) return;
      try {
        const product = await fetchAvailability(line.productId);
        if (!product) return; // unresolved → don't block
        const explicitlyOut =
          product.inStock === false ||
          (typeof product.stock === 'number' && product.stock <= 0 && product.inStock !== true);
        if (explicitlyOut) soldOut.push(line.name);
      } catch {
        /* fail-open: a fetch error must not wrongly block an otherwise-valid checkout */
      }
    }),
  );
  return { available: soldOut.length === 0, soldOut };
}
