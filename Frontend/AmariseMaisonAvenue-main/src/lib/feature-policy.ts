/**
 * Central policy for backend capabilities that return 501 NOT_IMPLEMENTED.
 * Every 501 routes through handleNotImplementedError() → a deterministic UI state.
 * No silent failure, no silent fallback.
 *
 *   HIDDEN   — non-critical: hide the UI entry entirely
 *   DISABLED — supporting: disable control + show "Coming Soon"
 *   BLOCKED  — checkout-critical: block the flow with a clear message
 *              (checkout overrides per CHECKOUT_RISK_MODE — see checkout-policy.ts)
 */
export type FeatureState = 'HIDDEN' | 'DISABLED' | 'BLOCKED';

export type DegradedFeature =
  | 'search'
  | 'analytics'
  | 'recommendations'
  | 'dynamicPricing'
  | 'inventoryLock'
  | 'fraudRisk'
  | 'preOrderPayment';

export const FEATURE_POLICY: Record<DegradedFeature, FeatureState> = {
  search:          'HIDDEN',    // non-critical → hide entry
  analytics:       'DISABLED',  // supporting → "Coming Soon"
  recommendations: 'DISABLED',  // supporting → "Coming Soon"
  dynamicPricing:  'HIDDEN',    // enhancement → fall back to product.basePrice (the real list price)
  inventoryLock:   'BLOCKED',   // checkout-critical (continuity may override)
  fraudRisk:       'BLOCKED',   // checkout-critical (continuity may override)
  preOrderPayment: 'BLOCKED',   // checkout-critical
};

export const FEATURE_MESSAGE: Record<DegradedFeature, string> = {
  search:          'Search is not available yet.',
  analytics:       'Analytics — Coming Soon.',
  recommendations: 'Recommendations — Coming Soon.',
  dynamicPricing:  'Standard pricing applies.',
  inventoryLock:   'Inventory reservation is temporarily unavailable.',
  fraudRisk:       'Checkout security check is unavailable.',
  preOrderPayment: 'Online payment initiation is unavailable.',
};

/** True when an ApiResult error (or ApiResponse) is a 501 NOT_IMPLEMENTED. */
export function isNotImplemented(result: { code?: number } | null | undefined): boolean {
  return result?.code === 501;
}

export interface NotImplementedUiState {
  feature: DegradedFeature;
  state: FeatureState;
  message: string;
}

/** Map a 501 to a deterministic UI state and log it (never silent). */
export function handleNotImplementedError(feature: DegradedFeature, detail?: string): NotImplementedUiState {
  const state = FEATURE_POLICY[feature];
  const message = FEATURE_MESSAGE[feature];
  // eslint-disable-next-line no-console
  console.warn(`[NOT_IMPLEMENTED] feature=${feature} ui=${state}${detail ? ` detail=${detail}` : ''}`);
  return { feature, state, message };
}
