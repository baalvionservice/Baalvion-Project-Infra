import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentSpine } from '../dist/index.mjs';

// The spine only touches the pool when a call actually writes; validate() is pure, so a stub
// pool is enough to exercise every guard.
const pool = { query: async () => ({ rows: [] }) };

const RAILS = { razorpay: 'razorpay', payu: 'payu', bank: 'bank_transfer' };
const railFor = (p) => RAILS[String(p).toLowerCase()];

const spine = createPaymentSpine({ pool, siteId: 'proxy', railFor });

const input = {
  paymentId: 'pay_proxy_1',
  provider: 'razorpay',
  transactionId: 'rzp_1',
  amountMinor: '499900',
  currency: 'INR',
  tenantId: 'org_42',
};

test('validates and attributes a capture to the configured site', () => {
  const r = spine.validate(input, 'CAPTURED');
  assert.equal(r.siteId, 'proxy');
  assert.equal(r.tenantId, 'org_42');
  assert.equal(r.rail, 'razorpay');
  assert.equal(r.amountMinor, 499900n);
  assert.equal(r.money.toDecimalString(), '4999.00');
  assert.equal(r.state, 'CAPTURED');
});

test('refuses a rail the site was never granted', () => {
  // proxy is razorpay/payu/bank_transfer — crypto belongs to community.
  assert.throws(() => spine.validate({ ...input, rail: 'crypto' }, 'CAPTURED'), (e) => e.code === 'RAIL_NOT_PERMITTED');
});

test('refuses rather than guessing when the provider is unknown', () => {
  assert.throws(
    () => spine.validate({ ...input, provider: 'mystery-gateway' }, 'CAPTURED'),
    /cannot determine the payment rail/,
  );
});

test('refuses a float amount', () => {
  assert.throws(() => spine.validate({ ...input, amountMinor: 4999.5 }, 'CAPTURED'), (e) => e.code === 'FLOAT_AMOUNT');
});

test('a site with no rails cannot use the spine at all', () => {
  const dead = createPaymentSpine({ pool, siteId: 'law', railFor });
  assert.throws(() => dead.validate(input, 'CAPTURED'), (e) => e.code === 'NO_RAILS_CONFIGURED');
});

test('an unregistered site is rejected at the first call', () => {
  const bogus = createPaymentSpine({ pool, siteId: 'nope', railFor });
  assert.throws(() => bogus.validate(input, 'CAPTURED'), (e) => e.code === 'UNKNOWN_SITE_ID');
});

test('failure records carry their reason; a success may not', () => {
  const f = spine.validate({ ...input, failureReason: 'insufficient_funds' }, 'FAILED');
  assert.equal(f.state, 'FAILED');
  assert.equal(f.failureReason, 'insufficient_funds');
  assert.throws(() => spine.validate({ ...input, failureReason: 'nope' }, 'CAPTURED'), (e) => e.code === 'INVALID_FIELD');
});

test('the same capture derives a stable idempotency key', () => {
  assert.equal(spine.validate(input, 'CAPTURED').idempotencyKey, spine.validate(input, 'CAPTURED').idempotencyKey);
  assert.equal(spine.validate(input, 'CAPTURED').idempotencyKey, 'pay_proxy_1:CAPTURED:rzp_1');
});
