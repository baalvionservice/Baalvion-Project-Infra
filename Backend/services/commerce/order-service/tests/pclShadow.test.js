'use strict';
/**
 * Shadow-mode adapter tests for order-service (no database required — a fake PaymentStateMachine is
 * injected). Verifies the Phase-1 safety contract: disabled is a no-op, the legacy → PaymentEvent
 * normalization is correct, the call NEVER throws even when apply() fails, and drift is detected.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const pclShadow = require('../service/pclShadow');

function fakeMachine(impl) {
  const calls = [];
  const machine = { apply: async (ev) => { calls.push(ev); return impl(ev); } };
  return { machine, calls };
}

test.afterEach(() => { pclShadow.__reset(); delete process.env.PCL_SHADOW; });

test('disabled (PCL_SHADOW unset): recordCapture is a no-op and never touches PCL', async () => {
  delete process.env.PCL_SHADOW;
  const { machine, calls } = fakeMachine(() => ({ result: 'applied', to: 'CAPTURED' }));
  pclShadow.__setMachineFactory(() => machine);
  const out = await pclShadow.recordCapture({ paymentId: 'o1', provider: 'razorpay', transactionId: 't1', amountMinor: 1000, currency: 'INR', orgId: 's1' });
  assert.equal(out, null);
  assert.equal(calls.length, 0, 'PCL must not be invoked while disabled');
});

test('enabled: capture normalizes to WEBHOOK_PAYMENT_SUCCESS keyed by orderId, minor-unit amount', async () => {
  process.env.PCL_SHADOW = 'true';
  const { machine, calls } = fakeMachine((ev) => ({ result: 'applied', paymentId: ev.paymentId, from: 'INITIATED', to: 'CAPTURED' }));
  pclShadow.__setMachineFactory(() => machine);
  const out = await pclShadow.recordCapture({ paymentId: 'order-123', provider: 'razorpay', transactionId: 'pay_abc', amountMinor: 49900, currency: 'INR', orgId: 'store-1' });
  assert.equal(calls.length, 1);
  const ev = calls[0];
  assert.equal(ev.type, 'WEBHOOK_PAYMENT_SUCCESS');
  assert.equal(ev.paymentId, 'order-123');
  assert.equal(ev.transactionId, 'pay_abc');
  assert.equal(ev.amount, 49900);
  assert.equal(ev.currency, 'INR');
  assert.equal(ev.provider, 'razorpay');
  assert.equal(ev.orgId, 'store-1');
  assert.equal(out.to, 'CAPTURED');
});

test('enabled: failure normalizes to WEBHOOK_PAYMENT_FAILED', async () => {
  process.env.PCL_SHADOW = 'true';
  const { machine, calls } = fakeMachine((ev) => ({ result: 'applied', paymentId: ev.paymentId, from: 'INITIATED', to: 'FAILED' }));
  pclShadow.__setMachineFactory(() => machine);
  await pclShadow.recordFailure({ paymentId: 'order-9', provider: 'unknown', transactionId: 'fail:declined', amountMinor: 1000, currency: 'INR', orgId: 's1' });
  assert.equal(calls[0].type, 'WEBHOOK_PAYMENT_FAILED');
});

test('NEVER throws: an apply() that rejects resolves to null (legacy path is unaffected)', async () => {
  process.env.PCL_SHADOW = 'true';
  pclShadow.__setMachineFactory(() => ({ apply: async () => { throw new Error('relation "pcl.payment_state" does not exist'); } }));
  const out = await pclShadow.recordCapture({ paymentId: 'o2', provider: 'razorpay', transactionId: 't2', amountMinor: 1000, currency: 'INR', orgId: 's1' });
  assert.equal(out, null, 'a shadow failure must be swallowed, not propagated');
});

test('drift detection: a PCL conflict is flagged as drift; an agreeing CAPTURED is not', () => {
  const conflict = pclShadow._internals.logOutcome({ result: 'conflict', paymentId: 'o3', from: 'CAPTURED', to: 'CAPTURED' }, 'failed', { provider: 'razorpay' });
  assert.equal(conflict, true, 'legacy=failed but PCL=conflict → drift');
  const agree = pclShadow._internals.logOutcome({ result: 'applied', paymentId: 'o4', from: 'INITIATED', to: 'CAPTURED' }, 'captured', { provider: 'razorpay' });
  assert.equal(agree, false, 'legacy=captured and PCL=CAPTURED → no drift');
  const mismatch = pclShadow._internals.logOutcome({ result: 'applied', paymentId: 'o5', from: 'INITIATED', to: 'FAILED' }, 'captured', { provider: 'razorpay' });
  assert.equal(mismatch, true, 'legacy=captured but PCL=FAILED → drift');
});
