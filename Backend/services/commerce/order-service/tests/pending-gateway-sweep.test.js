'use strict';
// PR3 (P2): gateway "paid-but-pending" reconciliation. When BOTH the synchronous confirm AND the
// webhook are lost, a payment stays pending forever and no existing report sees it (the ledger
// reconciliation only looks at captured/refunded rows). sweepPendingPayments polls the PSP for such
// rows and, when the gateway itself reports paid, settles them through the EXISTING idempotent
// capture path — so there is no duplicate-payment risk. Stripe/Razorpay only; PayU/bank skipped.
//
// Offline: data layer + provider + capture are stubbed (same approach as reconciliation.test.js).
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {};

const models = require('../models');
const paymentProvider = require('../service/paymentProvider');
const orderService = require('../service/orderService');
const reconciliation = require('../service/reconciliationService');

const STORE = '11111111-1111-1111-1111-111111111111';
const row = (over = {}) => ({ id: 'p1', orderId: 'ord1', transactionId: 'order_rzp_1', provider: 'razorpay', amount: '100.00', currencyCode: 'USD', orderNumber: 'ORD-1', ...over });

let pendingRows;
let captureCalls;
let statusResponders; // provider name -> getPaymentStatus(fn)

beforeEach(() => {
    pendingRows = [];
    captureCalls = [];
    statusResponders = {};

    // The pending-payment query: returns copies of the current pending set.
    models.sequelize.query = async () => pendingRows.map((r) => ({ ...r }));

    // getProvider returns a stub provider; providers with no getPaymentStatus (payu/bank/mock) are skipped.
    paymentProvider.getProvider = (p) => (statusResponders[p] ? { name: p, getPaymentStatus: statusResponders[p] } : { name: p });

    // Reuse point: the sweep settles via the existing idempotent capture. Simulate its effect — the
    // row is no longer 'pending' afterwards, so a re-sweep cannot reprocess it.
    orderService.capturePaymentFromWebhook = async (args) => {
        captureCalls.push(args);
        pendingRows = pendingRows.filter((r) => r.transactionId !== args.providerOrderId);
        return { ok: true };
    };
});

test('pending payment that is paid at the gateway → settles exactly once via the capture path', async () => {
    pendingRows = [row()];
    statusResponders.razorpay = async () => ({ status: 'captured', transactionId: 'pay_1', amountMinor: 10000, currency: 'USD' });

    const r = await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });

    assert.equal(r.settled, 1);
    assert.equal(captureCalls.length, 1);
    assert.equal(captureCalls[0].providerOrderId, 'order_rzp_1');
    assert.equal(captureCalls[0].providerPaymentId, 'pay_1');
    assert.equal(captureCalls[0].amount, 10000);
    assert.equal(captureCalls[0].currencyCode, 'USD');
});

test('re-running the sweep does not double-settle (settled row leaves the pending set)', async () => {
    pendingRows = [row()];
    statusResponders.razorpay = async () => ({ status: 'captured', transactionId: 'pay_1', amountMinor: 10000, currency: 'USD' });

    await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });
    const r2 = await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });

    assert.equal(captureCalls.length, 1, 'captured exactly once across two sweeps');
    assert.equal(r2.settled, 0);
});

test('gateway still pending → no settlement, row untouched', async () => {
    pendingRows = [row()];
    statusResponders.razorpay = async () => ({ status: 'pending' });

    const r = await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });

    assert.equal(r.settled, 0);
    assert.equal(r.stillPending, 1);
    assert.equal(captureCalls.length, 0);
});

test('gateway error (e.g. 429 rate limit) is isolated: logged + counted, never throws or settles', async () => {
    pendingRows = [row({ id: 'p1', transactionId: 'order_rzp_1' }), row({ id: 'p2', orderId: 'ord2', transactionId: 'order_rzp_2', amount: '50.00', orderNumber: 'ORD-2' })];
    let calls = 0;
    statusResponders.razorpay = async () => {
        calls += 1;
        if (calls === 1) throw new Error('razorpay request failed (429)');
        return { status: 'captured', transactionId: 'pay_2', amountMinor: 5000, currency: 'USD' };
    };

    const r = await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });

    assert.equal(r.errors, 1, 'the 429 row is counted as an error (left pending for the next sweep), not lost');
    assert.equal(r.settled, 1, 'the other row still settles — one failure does not abort the sweep');
    assert.equal(captureCalls.length, 1);
});

test('non-pollable providers (no getPaymentStatus: PayU/bank) are skipped, never settled', async () => {
    pendingRows = [row({ provider: 'payu', transactionId: 'txn_payu_1', currencyCode: 'INR' })];

    const r = await reconciliation.sweepPendingPayments(STORE, { delayMs: 0 });

    assert.equal(r.settled, 0);
    assert.equal(captureCalls.length, 0);
});
