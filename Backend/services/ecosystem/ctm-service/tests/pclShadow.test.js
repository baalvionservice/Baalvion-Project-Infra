'use strict';
/**
 * Shadow-mode adapter tests for ctm-service (no database — a fake PaymentStateMachine is injected).
 * Verifies the Phase-1 contract: disabled is a no-op, the legacy webhook → PaymentEvent
 * normalization is correct (keyed by ctm.payments.id), and the call NEVER throws on apply failure.
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

test('disabled: recordCapture is a no-op', async () => {
  delete process.env.PCL_SHADOW;
  const { machine, calls } = fakeMachine(() => ({ result: 'applied', to: 'CAPTURED' }));
  pclShadow.__setMachineFactory(() => machine);
  const out = await pclShadow.recordCapture({ paymentId: 'p1', provider: 'stripe', transactionId: 'ref1', amountMinor: 1000, currency: 'USD', orgId: 'co1' });
  assert.equal(out, null);
  assert.equal(calls.length, 0);
});

test('enabled: succeeded webhook normalizes to WEBHOOK_PAYMENT_SUCCESS keyed by payment.id', async () => {
  process.env.PCL_SHADOW = 'true';
  const { machine, calls } = fakeMachine((ev) => ({ result: 'applied', paymentId: ev.paymentId, from: 'INITIATED', to: 'CAPTURED' }));
  pclShadow.__setMachineFactory(() => machine);
  const out = await pclShadow.recordCapture({ paymentId: 'pay-uuid', provider: 'stripe', transactionId: 'pi_123', amountMinor: 2500, currency: 'USD', orgId: '42' });
  assert.equal(calls.length, 1);
  const ev = calls[0];
  assert.equal(ev.type, 'WEBHOOK_PAYMENT_SUCCESS');
  assert.equal(ev.paymentId, 'pay-uuid');
  assert.equal(ev.transactionId, 'pi_123');
  assert.equal(ev.amount, 2500);
  assert.equal(ev.currency, 'USD');
  assert.equal(ev.provider, 'stripe');
  assert.equal(out.to, 'CAPTURED');
});

test('NEVER throws: apply() rejection resolves to null', async () => {
  process.env.PCL_SHADOW = 'true';
  pclShadow.__setMachineFactory(() => ({ apply: async () => { throw new Error('db down'); } }));
  const out = await pclShadow.recordCapture({ paymentId: 'p2', provider: 'stripe', transactionId: 'r2', amountMinor: 1000, currency: 'USD', orgId: 'co1' });
  assert.equal(out, null);
});

test('drift detection: conflict flagged, agreeing capture not', () => {
  assert.equal(pclShadow._internals.logOutcome({ result: 'conflict', paymentId: 'p3', from: 'CAPTURED', to: 'CAPTURED' }, 'captured', { provider: 'stripe' }), true);
  assert.equal(pclShadow._internals.logOutcome({ result: 'applied', paymentId: 'p4', from: 'INITIATED', to: 'CAPTURED' }, 'captured', { provider: 'stripe' }), false);
});
