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
