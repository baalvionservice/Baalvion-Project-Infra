'use strict';
// PR1 (P0): the CTM webhook must distinguish NON-retryable rejects (bad signature, amount mismatch
// → 4xx) from RETRYABLE internal failures (DB/runtime error → 503), so a transient blip can never
// make a gateway give up and silently drop a real payment. Settlement stays idempotent across
// redelivery and self-heals a partial failure on the gateway's retry.
//
// No DB needed: the Sequelize models are stubbed in require.cache BEFORE the controller is loaded,
// and pay.verifyWebhook is swapped per-test (the controller and this test share the one module
// instance, so reassigning the method is observed by the handler).
const test = require('node:test');
const assert = require('node:assert/strict');

// ── Stub the models layer so the handler runs with no database ──────────────────
const modelsId = require.resolve('../models');
const db = {
  payments: { findOne: async () => null },
  invoices: { update: async () => [1] },
  subscriptions: { update: async () => [1] },
  integration_logs: { create: async () => ({}) },
};
require.cache[modelsId] = { id: modelsId, filename: modelsId, loaded: true, exports: db };

const pay = require('../service/payments');
const controller = require('../controller/paymentsController');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
const reqOf = (payload) => ({ rawBody: Buffer.from(JSON.stringify(payload || {})), headers: { 'x-test': '1' }, body: payload || {} });
// A mutable payment row whose save() persists like a real DB row (records call count).
const paymentRow = (over = {}) => ({
  id: 'pay_1', company_id: 'org_1', invoice_id: 'inv_1', subscription_id: 'sub_1',
  amount: 29, currency: 'USD', status: 'pending', _saved: 0,
  async save() { this._saved += 1; return this; },
  ...over,
});
const succeededEvt = (over = {}) => ({ status: 'succeeded', ref: 'order_1', amountMinor: 2900, currency: 'USD', type: 'payment.captured', raw: {}, ...over });

function withStubs(stubs, fn) {
  const origVerify = pay.verifyWebhook;
  const origFind = db.payments.findOne;
  const origInv = db.invoices.update;
  const origSub = db.subscriptions.update;
  if (stubs.verifyWebhook) pay.verifyWebhook = stubs.verifyWebhook;
  if (stubs.findOne) db.payments.findOne = stubs.findOne;
  if (stubs.invoiceUpdate) db.invoices.update = stubs.invoiceUpdate;
  if (stubs.subUpdate) db.subscriptions.update = stubs.subUpdate;
  return Promise.resolve(fn()).finally(() => {
    pay.verifyWebhook = origVerify;
    db.payments.findOne = origFind;
    db.invoices.update = origInv;
    db.subscriptions.update = origSub;
  });
}

test('invalid signature → 400 (non-retryable: a bad signature will not improve on retry)', async () => {
  await withStubs({ verifyWebhook: async () => { throw new Error('Invalid Razorpay signature'); } }, async () => {
    const res = mockRes();
    await controller.handleWebhook(reqOf({ event: 'x' }), res);
    assert.equal(res.statusCode, 400);
  });
});

test('amount/currency mismatch → 400 (deterministic reject)', async () => {
  await withStubs({
    verifyWebhook: async () => succeededEvt({ amountMinor: 9999 }),
    findOne: async () => paymentRow({ status: 'pending' }), // expected 2900, got 9999
  }, async () => {
    const res = mockRes();
    await controller.handleWebhook(reqOf({}), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'amount mismatch');
  });
});

test('internal DB error → 503 (retryable so the gateway redelivers — NO silent loss)', async () => {
  await withStubs({
    verifyWebhook: async () => succeededEvt(),
    findOne: async () => { throw new Error('connection terminated unexpectedly'); },
  }, async () => {
    const res = mockRes();
    await controller.handleWebhook(reqOf({}), res);
    assert.equal(res.statusCode, 503);
  });
});

test('replay of an already-succeeded payment → 200 idempotent, never re-saves', async () => {
  const row = paymentRow({ status: 'succeeded' });
  await withStubs({ verifyWebhook: async () => succeededEvt(), findOne: async () => row }, async () => {
    const res = mockRes();
    await controller.handleWebhook(reqOf({}), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.idempotent, true);
    assert.equal(row._saved, 0, 'an already-succeeded payment must not be re-applied');
  });
});

test('partial failure then retry → eventual consistency (invoice converges to Paid, single charge)', async () => {
  const row = paymentRow({ status: 'pending' });
  let invoiceCalls = 0;
  let invoicePaid = false;
  await withStubs({
    verifyWebhook: async () => succeededEvt(),
    findOne: async () => row,
    invoiceUpdate: async (vals) => {
      invoiceCalls += 1;
      if (invoiceCalls === 1) throw new Error('deadlock detected'); // transient failure on first delivery
      if (vals.status === 'Paid') invoicePaid = true;
      return [1];
    },
  }, async () => {
    // First delivery: payment flips to succeeded, invoice activation fails → 503 (gateway will retry).
    const res1 = mockRes();
    await controller.handleWebhook(reqOf({}), res1);
    assert.equal(res1.statusCode, 503);
    assert.equal(row.status, 'succeeded', 'payment is recorded succeeded even though activation failed');
    assert.equal(invoicePaid, false);

    // Retry delivery: payment already succeeded (no re-save), activation now succeeds → 200.
    const res2 = mockRes();
    await controller.handleWebhook(reqOf({}), res2);
    assert.equal(res2.statusCode, 200);
    assert.equal(invoicePaid, true, 'invoice converges to Paid on the gateway retry');
    assert.equal(row._saved, 1, 'payment saved exactly once across both deliveries (no double-apply)');
  });
});
