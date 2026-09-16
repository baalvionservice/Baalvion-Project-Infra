/**
 * Turning the platform's real subscription shapes into performance obligations.
 *
 * Three services model a billing period three ways — `billing_cycle` ('monthly' | 'annual') in
 * imperialpedia-service, `interval_days` in law-service, and explicit
 * `current_period_start`/`current_period_end` in proxy-service. Each is accepted here so the
 * recognition engine sees one shape and the services do not have to converge first.
 */
import { Money } from '@baalvion/money';
import { RevenueError, type PerformanceObligation, type TerminationPolicy } from './types';

export type BillingCycle = 'monthly' | 'annual' | 'quarterly' | 'weekly';

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  weekly: 0,
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

export interface SubscriptionPeriodInput {
  id: string;
  siteId: string;
  tenantId?: string | null;
  /** The amount actually charged for this period. */
  amount: Money;
  periodStart: Date;
  /** Supply this, or a cycle, or intervalDays — whichever the service records. */
  periodEnd?: Date;
  billingCycle?: BillingCycle;
  intervalDays?: number;
  cancelledAt?: Date | null;
  terminationPolicy?: TerminationPolicy;
  paymentId?: string | null;
  productRef?: string | null;
}

function addMonthsPreservingEom(d: Date, months: number): Date {
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  // 31 Jan + 1 month is 28/29 Feb, not 3 March. Clamp to the last day of the target month.
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Resolve the period end from whichever field the source service records. */
export function resolvePeriodEnd(input: SubscriptionPeriodInput): Date {
  if (input.periodEnd) return input.periodEnd;
  if (input.billingCycle) {
    const months = CYCLE_MONTHS[input.billingCycle];
    if (months > 0) return addMonthsPreservingEom(input.periodStart, months);
    // Weekly is the one cycle not expressible in whole months.
    return new Date(input.periodStart.getTime() + 7 * 86_400_000);
  }
  if (input.intervalDays && input.intervalDays > 0) {
    return new Date(input.periodStart.getTime() + input.intervalDays * 86_400_000);
  }
  throw new RevenueError(
    'INVALID_PERIOD',
    `Subscription ${input.id} has no periodEnd, billingCycle or intervalDays — the service period cannot be inferred, and guessing it would misstate revenue.`,
    { id: input.id },
  );
}

/** Build the straight-line obligation for one billing period. */
export function obligationForPeriod(input: SubscriptionPeriodInput): PerformanceObligation {
  return {
    id: input.id,
    siteId: input.siteId,
    tenantId: input.tenantId ?? null,
    amount: input.amount,
    method: 'STRAIGHT_LINE',
    serviceStart: input.periodStart,
    serviceEnd: resolvePeriodEnd(input),
    terminatedAt: input.cancelledAt ?? null,
    terminationPolicy: input.terminationPolicy ?? 'FORFEIT',
    paymentId: input.paymentId ?? null,
    productRef: input.productRef ?? null,
  };
}

/** A one-off charge — a setup fee, a single purchase — earned on delivery. */
export function obligationForOneOff(input: {
  id: string;
  siteId: string;
  tenantId?: string | null;
  amount: Money;
  deliveredAt: Date;
  paymentId?: string | null;
  productRef?: string | null;
}): PerformanceObligation {
  return {
    id: input.id,
    siteId: input.siteId,
    tenantId: input.tenantId ?? null,
    amount: input.amount,
    method: 'POINT_IN_TIME',
    serviceStart: input.deliveredAt,
    serviceEnd: input.deliveredAt,
    paymentId: input.paymentId ?? null,
    productRef: input.productRef ?? null,
  };
}

/**
 * Normalised monthly recurring revenue for one subscription period.
 *
 * MRR is a *rate*, not cash: an annual plan of 12,000 contributes 1,000 of MRR, not 12,000 in
 * the month it was billed. Computed as an exact fraction of the period's charge so a quarterly
 * or weekly plan normalises correctly too, and it never sums cash across cycles.
 */
export function monthlyRecurringRevenue(input: SubscriptionPeriodInput): Money {
  const start = input.periodStart;
  const end = resolvePeriodEnd(input);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  // 365/12 = 30.4166… days in an average month; expressed as 36500/1200 to stay exact.
  return input.amount.multiplyRatio(36_500n, BigInt(days) * 1200n, 'HALF_UP');
}

/** ARR is MRR x 12 — an exact integer scaling, never a re-derivation from cash. */
export function annualRunRate(input: SubscriptionPeriodInput): Money {
  return monthlyRecurringRevenue(input).multiply(12);
}
