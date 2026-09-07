import type { Money } from '@baalvion/money';

/**
 * How the money is earned.
 *
 * The distinction is the whole point of this package: taking 12,000 for an annual plan does not
 * earn 12,000 today. It creates an obligation to deliver twelve months of service, and revenue
 * is earned as that service is delivered. Reporting the cash as revenue overstates this month
 * and understates the next eleven — which is the error an auditor finds first.
 */
export type RecognitionMethod =
  /** Earned on delivery — a one-off sale, a gift-card redemption, a setup fee. */
  | 'POINT_IN_TIME'
  /** Earned evenly across the service period — the standard subscription treatment. */
  | 'STRAIGHT_LINE';

/** What happens to the unearned balance when service ends early. */
export type TerminationPolicy =
  /** The customer forfeits the remainder; it is earned at termination. */
  | 'FORFEIT'
  /** The remainder is owed back; it stays a liability until refunded. */
  | 'REFUND';

/**
 * A performance obligation — one promise to deliver, and the money attached to it.
 *
 * Deliberately not "a subscription": one payment can create several obligations (a plan plus a
 * one-off setup fee earn on different schedules), and conflating them is exactly what naive
 * revenue reporting gets wrong.
 */
export interface PerformanceObligation {
  id: string;
  /** Which property earned it. */
  siteId: string;
  /** The earner within that site, where there is one. */
  tenantId?: string | null;
  /** Total consideration allocated to this obligation. */
  amount: Money;
  method: RecognitionMethod;
  /** Service period start, inclusive. */
  serviceStart: Date;
  /** Service period end, exclusive. Equal to serviceStart for a point-in-time obligation. */
  serviceEnd: Date;
  /** When service actually stopped, if earlier than serviceEnd. */
  terminatedAt?: Date | null;
  terminationPolicy?: TerminationPolicy;
  /** The payment this obligation came from, so revenue reconciles back to cash. */
  paymentId?: string | null;
  productRef?: string | null;
}

/** One bucket of a recognition schedule. */
export interface RecognitionPeriod {
  periodStart: Date;
  /** Exclusive. */
  periodEnd: Date;
  amount: Money;
}

export interface RevenueSummary {
  /** Earned so far. */
  recognized: Money;
  /** Not yet earned — a liability, not revenue. */
  deferred: Money;
  /** Owed back after an early termination under a REFUND policy. */
  refundable: Money;
  total: Money;
}

export class RevenueError extends Error {
  public readonly code: string;
  public readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'RevenueError';
    this.code = code;
    this.detail = detail;
  }
}
