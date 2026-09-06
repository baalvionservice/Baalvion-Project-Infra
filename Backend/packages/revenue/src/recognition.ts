/**
 * Revenue recognition.
 *
 * Cash received is not revenue earned. This module turns a payment's service period into an
 * auditable schedule, so a monthly close can state what was actually earned in the month and
 * what is still a liability.
 *
 * Two properties matter more than anything else here, and both are enforced by construction:
 *
 *   1. The schedule sums to the total. Splitting 12,000 across 365 days does not divide evenly,
 *      so the remainder is distributed with `Money.allocate` rather than rounded per-day. Round
 *      each day independently and the year is out by a few units — small, permanent, and
 *      exactly the discrepancy an auditor traces.
 *
 *   2. Recognition is monotonic. Recognised revenue never decreases as time advances, so a
 *      restated period cannot silently move money backwards.
 */
import { Money } from '@baalvion/money';
import {
  RevenueError,
  type PerformanceObligation,
  type RecognitionPeriod,
  type RevenueSummary,
} from './types';

const MS_PER_DAY = 86_400_000;

function assertValid(ob: PerformanceObligation): void {
  if (!ob || !ob.id) throw new RevenueError('INVALID_OBLIGATION', 'Obligation needs an id');
  if (!(ob.amount instanceof Money)) {
    throw new RevenueError('INVALID_AMOUNT', `Obligation ${ob.id} amount must be a Money`, { id: ob.id });
  }
  if (ob.amount.isNegative()) {
    throw new RevenueError('INVALID_AMOUNT', `Obligation ${ob.id} cannot be negative — record a refund as its own obligation`, { id: ob.id });
  }
  if (!(ob.serviceStart instanceof Date) || Number.isNaN(ob.serviceStart.getTime())) {
    throw new RevenueError('INVALID_PERIOD', `Obligation ${ob.id} has an invalid serviceStart`, { id: ob.id });
  }
  if (!(ob.serviceEnd instanceof Date) || Number.isNaN(ob.serviceEnd.getTime())) {
    throw new RevenueError('INVALID_PERIOD', `Obligation ${ob.id} has an invalid serviceEnd`, { id: ob.id });
  }
  if (ob.method === 'STRAIGHT_LINE' && ob.serviceEnd.getTime() <= ob.serviceStart.getTime()) {
    throw new RevenueError(
      'INVALID_PERIOD',
      `Obligation ${ob.id} is STRAIGHT_LINE but its service period is empty. A period with no duration cannot be earned over time — use POINT_IN_TIME.`,
      { id: ob.id },
    );
  }
  if (ob.terminatedAt && ob.terminatedAt.getTime() < ob.serviceStart.getTime()) {
    throw new RevenueError('INVALID_PERIOD', `Obligation ${ob.id} was terminated before service began`, { id: ob.id });
  }
}

/** Whole days in the service period, at least one. */
export function serviceDays(ob: PerformanceObligation): number {
  const ms = ob.serviceEnd.getTime() - ob.serviceStart.getTime();
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
}

/**
 * The per-day split. Uses `Money.allocate`, so the days always sum back to the exact total —
 * the property a ledger depends on.
 *
 * Memoised per obligation, because it is not cheap and it is asked for constantly: building one
 * year's monthly schedule calls `recognizedThrough` twice per month, and each of those splits
 * all 365 days again. Without the cache a thousand-subscription close spends seconds re-deriving
 * the same arrays; with it, once per obligation. A WeakMap so a finished obligation is collected
 * normally rather than held alive by its own cache.
 */
const dailyCache = new WeakMap<PerformanceObligation, Money[]>();

export function dailyAmounts(ob: PerformanceObligation): Money[] {
  assertValid(ob);
  if (ob.method === 'POINT_IN_TIME') return [ob.amount];
  const cached = dailyCache.get(ob);
  if (cached) return cached;
  const days = ob.amount.allocate(new Array(serviceDays(ob)).fill(1));
  dailyCache.set(ob, days);
  return days;
}

/**
 * Running totals of the daily split, so "earned by day N" is a lookup rather than a sum.
 *
 * Index i holds the total of the first i days, which makes every recognition question O(1)
 * after the first — the difference between a close that takes seconds and one that takes
 * minutes as the book grows.
 */
const cumulativeCache = new WeakMap<PerformanceObligation, Money[]>();

function cumulativeThrough(ob: PerformanceObligation, days: number): Money {
  let totals = cumulativeCache.get(ob);
  if (!totals) {
    const daily = dailyAmounts(ob);
    totals = [Money.zero(ob.amount.currency)];
    for (const d of daily) totals.push(totals[totals.length - 1]!.add(d));
    cumulativeCache.set(ob, totals);
  }
  const index = Math.max(0, Math.min(days, totals.length - 1));
  return totals[index]!;
}

/** The last moment service is actually delivered. */
function effectiveEnd(ob: PerformanceObligation): Date {
  if (ob.terminatedAt && ob.terminatedAt.getTime() < ob.serviceEnd.getTime()) return ob.terminatedAt;
  return ob.serviceEnd;
}

function elapsedDays(ob: PerformanceObligation, asOf: Date): number {
  const end = Math.min(asOf.getTime(), effectiveEnd(ob).getTime());
  const ms = end - ob.serviceStart.getTime();
  if (ms <= 0) return 0;
  return Math.min(Math.floor(ms / MS_PER_DAY), serviceDays(ob));
}

/**
 * Revenue earned from this obligation up to `asOf` (exclusive).
 *
 * Under a FORFEIT termination the unearned balance is earned at the moment service stops —
 * the customer walked away from it. Under REFUND it is not earned at all; it becomes money
 * owed back, which `refundableAt` reports.
 */
export function recognizedThrough(ob: PerformanceObligation, asOf: Date): Money {
  assertValid(ob);
  const zero = Money.zero(ob.amount.currency);

  if (ob.method === 'POINT_IN_TIME') {
    return asOf.getTime() >= ob.serviceStart.getTime() ? ob.amount : zero;
  }

  const elapsed = elapsedDays(ob, asOf);
  const earned = cumulativeThrough(ob, elapsed);

  const terminated = ob.terminatedAt && asOf.getTime() >= ob.terminatedAt.getTime();
  if (terminated && (ob.terminationPolicy ?? 'FORFEIT') === 'FORFEIT') {
    // The remainder is earned at termination, so the obligation closes fully recognised.
    return ob.amount;
  }
  return earned;
}

/** Money owed back after an early termination under a REFUND policy. Zero otherwise. */
export function refundableAt(ob: PerformanceObligation, asOf: Date): Money {
  assertValid(ob);
  const zero = Money.zero(ob.amount.currency);
  if (!ob.terminatedAt || asOf.getTime() < ob.terminatedAt.getTime()) return zero;
  if ((ob.terminationPolicy ?? 'FORFEIT') !== 'REFUND') return zero;
  return ob.amount.subtract(recognizedThrough(ob, asOf));
}

/** The unearned balance — a liability on the balance sheet, never revenue. */
export function deferredAt(ob: PerformanceObligation, asOf: Date): Money {
  assertValid(ob);
  return ob.amount.subtract(recognizedThrough(ob, asOf)).subtract(refundableAt(ob, asOf));
}

/**
 * Revenue earned in the window [from, to). This is what a monthly close reports, and it is
 * derived by difference so consecutive periods can never overlap or leave a gap.
 */
export function recognizeBetween(ob: PerformanceObligation, from: Date, to: Date): Money {
  if (to.getTime() < from.getTime()) {
    throw new RevenueError('INVALID_PERIOD', 'Recognition window ends before it begins', { from, to });
  }
  return recognizedThrough(ob, to).subtract(recognizedThrough(ob, from));
}

/** Start of the UTC calendar month containing `d`. */
function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/**
 * The schedule a monthly close consumes: one bucket per calendar month the obligation touches.
 * Buckets sum to the full recognised amount, so the schedule and the total can never disagree.
 */
export function scheduleByMonth(ob: PerformanceObligation): RecognitionPeriod[] {
  assertValid(ob);
  if (ob.method === 'POINT_IN_TIME') {
    const start = monthStart(ob.serviceStart);
    return [{ periodStart: start, periodEnd: addMonths(start, 1), amount: ob.amount }];
  }

  const finalEnd = effectiveEnd(ob);
  const closesFully = Boolean(ob.terminatedAt) && (ob.terminationPolicy ?? 'FORFEIT') === 'FORFEIT';
  const periods: RecognitionPeriod[] = [];

  let cursor = monthStart(ob.serviceStart);
  while (cursor.getTime() < finalEnd.getTime()) {
    const next = addMonths(cursor, 1);
    // The last bucket uses the obligation's own end so a FORFEIT remainder lands there rather
    // than being stranded outside the schedule.
    const windowEnd = next.getTime() >= finalEnd.getTime() && closesFully ? new Date(finalEnd.getTime() + 1) : next;
    const amount = recognizeBetween(ob, cursor, windowEnd);
    if (!amount.isZero() || periods.length === 0) {
      periods.push({ periodStart: cursor, periodEnd: next, amount });
    }
    cursor = next;
  }
  return periods;
}

/** Recognised / deferred / refundable across a portfolio, as of a date. */
export function summarize(obligations: PerformanceObligation[], asOf: Date, currency?: string): RevenueSummary {
  const ccy = currency ?? (obligations[0] ? obligations[0].amount.currency : undefined);
  if (!ccy) {
    throw new RevenueError('EMPTY_PORTFOLIO', 'summarize needs at least one obligation, or an explicit currency');
  }
  const zero = Money.zero(ccy);
  return obligations.reduce<RevenueSummary>(
    (acc, ob) => {
      if (ob.amount.currency !== ccy) {
        // Summing across currencies produces a number that looks authoritative and is meaningless.
        throw new RevenueError(
          'CURRENCY_MISMATCH',
          `Obligation ${ob.id} is ${ob.amount.currency} but this summary is ${ccy}. Summarise per currency and convert deliberately through fx-service.`,
          { id: ob.id },
        );
      }
      return {
        recognized: acc.recognized.add(recognizedThrough(ob, asOf)),
        deferred: acc.deferred.add(deferredAt(ob, asOf)),
        refundable: acc.refundable.add(refundableAt(ob, asOf)),
        total: acc.total.add(ob.amount),
      };
    },
    { recognized: zero, deferred: zero, refundable: zero, total: zero },
  );
}
