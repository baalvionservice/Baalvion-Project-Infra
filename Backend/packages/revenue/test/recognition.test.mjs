import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '@baalvion/money';
import {
  recognizedThrough, deferredAt, refundableAt, recognizeBetween,
  scheduleByMonth, dailyAmounts, serviceDays, summarize,
  obligationForPeriod, obligationForOneOff, monthlyRecurringRevenue, annualRunRate,
  resolvePeriodEnd, RevenueError,
} from '../dist/index.mjs';

const D = (s) => new Date(s);
const INR = (s) => Money.fromDecimal(s, 'INR');

// An annual plan billed on 1 Jan 2026: the case naive reporting gets wrong.
const annual = obligationForPeriod({
  id: 'sub_1', siteId: 'imperialpedia', tenantId: 'org_1',
  amount: INR('12000.00'), periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual',
});

// ---------------------------------------------------------------- the core claim

test('cash received on day one is not revenue earned on day one', () => {
  assert.equal(recognizedThrough(annual, D('2026-01-01T00:00:00Z')).toDecimalString(), '0.00');
  assert.equal(deferredAt(annual, D('2026-01-01T00:00:00Z')).toDecimalString(), '12000.00');
});

test('revenue accrues across the service period and closes at exactly the total', () => {
  const half = recognizedThrough(annual, D('2026-07-02T00:00:00Z'));
  assert.ok(half.greaterThan(INR('5900.00')) && half.lessThan(INR('6100.00')), `half-year was ${half}`);
  assert.equal(recognizedThrough(annual, D('2027-01-01T00:00:00Z')).toDecimalString(), '12000.00');
  assert.equal(deferredAt(annual, D('2027-01-01T00:00:00Z')).toDecimalString(), '0.00');
});

test('recognised + deferred always equals the total, at any instant', () => {
  for (const d of ['2026-01-01', '2026-02-14', '2026-06-30', '2026-12-31', '2027-06-01']) {
    const asOf = D(`${d}T00:00:00Z`);
    const sum = recognizedThrough(annual, asOf).add(deferredAt(annual, asOf)).add(refundableAt(annual, asOf));
    assert.equal(sum.toDecimalString(), '12000.00', `broke on ${d}`);
  }
});

test('recognition never moves backwards as time advances', () => {
  let previous = INR('0.00');
  for (let day = 0; day <= 400; day += 7) {
    const asOf = new Date(Date.UTC(2026, 0, 1) + day * 86400000);
    const now = recognizedThrough(annual, asOf);
    assert.ok(now.greaterThanOrEqual(previous), `went backwards at day ${day}`);
    previous = now;
  }
});

// ---------------------------------------------------------------- exactness

test('the daily split sums back to the total with no lost unit', () => {
  const days = dailyAmounts(annual);
  assert.equal(days.length, serviceDays(annual));
  assert.equal(Money.sum(...days).toDecimalString(), '12000.00');
});

test('an amount that does not divide evenly still reconciles', () => {
  // 100.00 over 365 days is 0.273972…/day — the case per-day rounding gets wrong.
  const ob = obligationForPeriod({
    id: 'sub_odd', siteId: 'law', amount: INR('100.00'),
    periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual',
  });
  const days = dailyAmounts(ob);
  assert.equal(Money.sum(...days).toDecimalString(), '100.00');
  assert.equal(recognizedThrough(ob, D('2027-01-01T00:00:00Z')).toDecimalString(), '100.00');
});

test('monthly buckets sum to the annual total', () => {
  const schedule = scheduleByMonth(annual);
  assert.equal(schedule.length, 12);
  assert.equal(Money.sum(...schedule.map((p) => p.amount)).toDecimalString(), '12000.00');
  // Months differ in length, so the buckets are not identical — and should not be.
  assert.notEqual(schedule[0].amount.toDecimalString(), schedule[1].amount.toDecimalString());
});

test('consecutive windows tile the period with no gap or overlap', () => {
  const q1 = recognizeBetween(annual, D('2026-01-01T00:00:00Z'), D('2026-04-01T00:00:00Z'));
  const q2 = recognizeBetween(annual, D('2026-04-01T00:00:00Z'), D('2026-07-01T00:00:00Z'));
  const q3 = recognizeBetween(annual, D('2026-07-01T00:00:00Z'), D('2026-10-01T00:00:00Z'));
  const q4 = recognizeBetween(annual, D('2026-10-01T00:00:00Z'), D('2027-01-01T00:00:00Z'));
  assert.equal(Money.sum(q1, q2, q3, q4).toDecimalString(), '12000.00');
});

// ---------------------------------------------------------------- termination

test('a forfeited cancellation earns the remainder at termination', () => {
  const ob = obligationForPeriod({
    id: 'sub_f', siteId: 'proxy', amount: INR('12000.00'),
    periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual',
    cancelledAt: D('2026-04-01T00:00:00Z'), terminationPolicy: 'FORFEIT',
  });
  assert.equal(recognizedThrough(ob, D('2026-04-01T00:00:00Z')).toDecimalString(), '12000.00');
  assert.equal(deferredAt(ob, D('2026-04-01T00:00:00Z')).toDecimalString(), '0.00');
  assert.equal(refundableAt(ob, D('2026-04-01T00:00:00Z')).toDecimalString(), '0.00');
});

test('a refundable cancellation leaves the remainder owed, not earned', () => {
  const ob = obligationForPeriod({
    id: 'sub_r', siteId: 'proxy', amount: INR('12000.00'),
    periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual',
    cancelledAt: D('2026-04-01T00:00:00Z'), terminationPolicy: 'REFUND',
  });
  const asOf = D('2026-04-01T00:00:00Z');
  const earned = recognizedThrough(ob, asOf);
  const owed = refundableAt(ob, asOf);
  assert.ok(earned.lessThan(INR('3100.00')), `earned too much: ${earned}`);
  assert.equal(earned.add(owed).toDecimalString(), '12000.00');
  assert.equal(deferredAt(ob, asOf).toDecimalString(), '0.00');
});

test('a cancelled subscription stops accruing after termination', () => {
  const ob = obligationForPeriod({
    id: 'sub_r2', siteId: 'proxy', amount: INR('12000.00'),
    periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual',
    cancelledAt: D('2026-04-01T00:00:00Z'), terminationPolicy: 'REFUND',
  });
  const atCancel = recognizedThrough(ob, D('2026-04-01T00:00:00Z'));
  const muchLater = recognizedThrough(ob, D('2027-06-01T00:00:00Z'));
  assert.equal(atCancel.toDecimalString(), muchLater.toDecimalString());
});

// ---------------------------------------------------------------- one-off

test('a one-off charge is earned on delivery', () => {
  const fee = obligationForOneOff({ id: 'fee_1', siteId: 'ctm', amount: INR('500.00'), deliveredAt: D('2026-03-10T00:00:00Z') });
  assert.equal(recognizedThrough(fee, D('2026-03-09T00:00:00Z')).toDecimalString(), '0.00');
  assert.equal(recognizedThrough(fee, D('2026-03-10T00:00:00Z')).toDecimalString(), '500.00');
  assert.equal(deferredAt(fee, D('2026-03-10T00:00:00Z')).toDecimalString(), '0.00');
});

// ---------------------------------------------------------------- period shapes

test('accepts all three period shapes the platform actually records', () => {
  // imperialpedia-service: billing_cycle
  assert.equal(resolvePeriodEnd({ id: 'a', siteId: 's', amount: INR('1.00'), periodStart: D('2026-01-31T00:00:00Z'), billingCycle: 'monthly' }).toISOString(), '2026-02-28T00:00:00.000Z');
  // law-service: interval_days
  assert.equal(resolvePeriodEnd({ id: 'b', siteId: 's', amount: INR('1.00'), periodStart: D('2026-01-01T00:00:00Z'), intervalDays: 30 }).toISOString(), '2026-01-31T00:00:00.000Z');
  // proxy-service: explicit period end
  assert.equal(resolvePeriodEnd({ id: 'c', siteId: 's', amount: INR('1.00'), periodStart: D('2026-01-01T00:00:00Z'), periodEnd: D('2026-03-01T00:00:00Z') }).toISOString(), '2026-03-01T00:00:00.000Z');
});

test('31 Jan + 1 month is end of February, not 3 March', () => {
  const end = resolvePeriodEnd({ id: 'eom', siteId: 's', amount: INR('1.00'), periodStart: D('2026-01-31T00:00:00Z'), billingCycle: 'monthly' });
  assert.equal(end.getUTCMonth(), 1);
  assert.equal(end.getUTCDate(), 28); // 2026 is not a leap year
});

test('refuses to guess a service period it was not given', () => {
  assert.throws(
    () => resolvePeriodEnd({ id: 'x', siteId: 's', amount: INR('1.00'), periodStart: D('2026-01-01T00:00:00Z') }),
    (e) => e.code === 'INVALID_PERIOD',
  );
});

// ---------------------------------------------------------------- MRR / ARR

test('MRR is a rate, not the cash taken', () => {
  // The whole point: an annual plan of 12,000 is 1,000 of MRR, not 12,000.
  const mrr = monthlyRecurringRevenue({ id: 'm', siteId: 's', amount: INR('12000.00'), periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual' });
  assert.equal(mrr.toDecimalString(), '1000.00');
  assert.equal(annualRunRate({ id: 'm', siteId: 's', amount: INR('12000.00'), periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual' }).toDecimalString(), '12000.00');
});

test('a monthly plan normalises to roughly its own charge', () => {
  const mrr = monthlyRecurringRevenue({ id: 'm2', siteId: 's', amount: INR('1000.00'), periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'monthly' });
  assert.ok(mrr.greaterThan(INR('970.00')) && mrr.lessThan(INR('1030.00')), `monthly MRR was ${mrr}`);
});

// ---------------------------------------------------------------- portfolio + guards

test('summarises a portfolio and refuses to mix currencies', () => {
  const usd = obligationForPeriod({ id: 'u', siteId: 'ctm', amount: Money.fromDecimal('120.00', 'USD'), periodStart: D('2026-01-01T00:00:00Z'), billingCycle: 'annual' });
  const s = summarize([annual], D('2026-01-01T00:00:00Z'));
  assert.equal(s.total.toDecimalString(), '12000.00');
  assert.equal(s.deferred.toDecimalString(), '12000.00');
  assert.equal(s.recognized.toDecimalString(), '0.00');
  assert.throws(() => summarize([annual, usd], D('2026-01-01T00:00:00Z')), (e) => e.code === 'CURRENCY_MISMATCH');
});

test('rejects obligations that cannot be recognised honestly', () => {
  assert.throws(() => recognizedThrough({ id: 'z', siteId: 's', amount: INR('1.00'), method: 'STRAIGHT_LINE', serviceStart: D('2026-01-01T00:00:00Z'), serviceEnd: D('2026-01-01T00:00:00Z') }, D('2026-06-01T00:00:00Z')), (e) => e.code === 'INVALID_PERIOD');
  assert.throws(() => recognizedThrough({ id: 'z2', siteId: 's', amount: INR('-5.00'), method: 'POINT_IN_TIME', serviceStart: D('2026-01-01T00:00:00Z'), serviceEnd: D('2026-01-01T00:00:00Z') }, D('2026-06-01T00:00:00Z')), (e) => e.code === 'INVALID_AMOUNT');
});
