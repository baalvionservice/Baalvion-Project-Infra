import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWebhook,
  normalizeSagaEvent,
  normalizeReconciliation,
  targetStateOf,
  dedupeKey,
} from '../dist/index.mjs';

const money = { amountMinor: 4999, currency: 'INR' };

test('normalizeWebhook maps "captured" -> WEBHOOK_PAYMENT_SUCCESS (target CAPTURED)', () => {
  const e = normalizeWebhook({
    provider: 'razorpay',
    status: 'captured',
    paymentId: 'pay_1',
    transactionId: 'rzp_evt_1',
    money,
  });
  assert.equal(e.type, 'WEBHOOK_PAYMENT_SUCCESS');
  assert.equal(targetStateOf(e), 'CAPTURED');
  assert.equal(e.amount, 4999);
});

test('normalizeWebhook maps "authorized" -> AUTHORIZED', () => {
  const e = normalizeWebhook({ provider: 'stripe', status: 'authorized', paymentId: 'p', transactionId: 't', money });
  assert.equal(targetStateOf(e), 'AUTHORIZED');
});

test('normalizeWebhook returns null for non-actionable status (pending)', () => {
  const e = normalizeWebhook({ provider: 'stripe', status: 'pending', paymentId: 'p', transactionId: 't', money });
  assert.equal(e, null);
});

test('normalizeSagaEvent maps completed topic -> SAGA_CONFIRMED', () => {
  const e = normalizeSagaEvent({
    topic: 'payments.transaction.completed',
    paymentId: 'pay_2',
    provider: 'internal',
    transactionId: 'txn_2',
    money,
  });
  assert.equal(e.type, 'SAGA_CONFIRMED');
  assert.equal(targetStateOf(e), 'CAPTURED');
});

test('normalizeSagaEvent maps failed/reversed topics -> FAIL', () => {
  for (const topic of ['payments.transaction.failed', 'payments.transaction.reversed']) {
    const e = normalizeSagaEvent({ topic, paymentId: 'p', provider: 'internal', transactionId: 't', money });
    assert.equal(targetStateOf(e), 'FAILED');
  }
});

test('normalizeReconciliation maps gateway "settled" -> SETTLED', () => {
  const e = normalizeReconciliation({
    gatewayStatus: 'settled',
    paymentId: 'pay_3',
    provider: 'payu',
    transactionId: 'txn_3',
    money,
  });
  assert.equal(targetStateOf(e), 'SETTLED');
});

test('dedupeKey is (paymentId, eventType, transactionId)', () => {
  const e = normalizeWebhook({ provider: 'stripe', status: 'succeeded', paymentId: 'pay_X', transactionId: 'tx_Y', money });
  assert.equal(dedupeKey(e), 'pay_X::WEBHOOK_PAYMENT_SUCCESS::tx_Y');
});

test('normalize rejects float amounts (money must be minor-unit integer)', () => {
  assert.throws(() =>
    normalizeWebhook({ provider: 'stripe', status: 'succeeded', paymentId: 'p', transactionId: 't', money: { amountMinor: 49.99, currency: 'INR' } }),
  );
});
