/**
 * The canonical payment lifecycle — the ONLY state vocabulary in the platform.
 *
 * Every adapter's native status (CTM `succeeded`, order-service `captured`, the
 * Java gateway `CAPTURED`, GTI `COMPLETED`, a raw provider string, …) is normalized
 * into one of these five states before it can touch payment state. There is no
 * sixth state and no service-local variant.
 *
 *   INITIATED ──▶ AUTHORIZED ──▶ CAPTURED ──▶ SETTLED   (the success ladder)
 *        │             │             ▲
 *        └─────────────┴─────────────┘
 *        └────────────────────────────────▶ FAILED      (pre-capture terminal)
 *
 * The ladder is strictly monotonic: a transition applies only if it *advances* rank.
 * SETTLED and FAILED are terminal. This monotonicity is what makes every transition
 * idempotent and replay-safe — re-applying or receiving an out-of-order event can
 * never move state backwards, so it can never lose a captured payment or resurrect
 * a failed one.
 */

export const PAYMENT_STATES = ['INITIATED', 'AUTHORIZED', 'CAPTURED', 'SETTLED', 'FAILED'] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

/**
 * Rank on the success ladder. FAILED is deliberately absent — it is a *side* terminal,
 * not a point on the ladder, so it is handled by explicit rule rather than by rank.
 */
export const STATE_RANK: Record<Exclude<PaymentState, 'FAILED'>, number> = {
  INITIATED: 0,
  AUTHORIZED: 1,
  CAPTURED: 2,
  SETTLED: 3,
};

export const TERMINAL_STATES: ReadonlySet<PaymentState> = new Set<PaymentState>(['SETTLED', 'FAILED']);

export function isTerminal(state: PaymentState): boolean {
  return TERMINAL_STATES.has(state);
}

/** Rank on the success ladder, or `null` for FAILED (off-ladder). */
export function rankOf(state: PaymentState): number | null {
  return state === 'FAILED' ? null : STATE_RANK[state];
}
