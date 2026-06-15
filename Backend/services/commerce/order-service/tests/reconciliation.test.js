'use strict';
// Financial reconciliation — refund lifecycle + ledger mirroring + report classification.
// Exercises the real services with the data layer, provider, and ledger HTTP client stubbed.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {};

const models = require('../models');
const config = require('../config/appConfig');
const ledgerClient = require('../service/ledgerClient');
const orderService = require('../service/orderService');
const reconciliation = require('../service/reconciliationService');
const ledgerOutbox = require('../service/ledgerOutbox');

// Force the deterministic, non-production MOCK payment provider so the refund lifecycle is exercised
// offline. config/appConfig loads .env with { override: true }, which sets PAYMENT_PROVIDER=razorpay;
// left as-is, getProvider() would resolve the REAL Razorpay adapter and refundPayment() would make a
// live api.razorpay.com call (404 for a synthetic payment id). getProvider() reads this env var fresh
// on every call, and dotenv has already run by this point, so setting it here is authoritative.
// This is the "provider stubbed" the test header refers to — the mock refund always succeeds locally.
process.env.PAYMENT_PROVIDER = 'mock';

const STORE = '11111111-1111-1111-1111-111111111111';
const ledgerCalls = [];
async function code(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

let order;
beforeEach(() => {
    ledgerCalls.length = 0;
    order = { id: 'ord1', storeId: STORE, paymentStatus: 'paid', status: 'delivered', totalAmount: '100.00', currencyCode: 'USD', orderNumber: 'ORD-1',
        async update(p) { Object.assign(this, p); }, toJSON() { return { id: this.id, paymentStatus: this.paymentStatus, status: this.status }; } };
    models.OrdersOrder.findOne = async ({ where }) => (where.id === 'ord1' && where.storeId === STORE) ? order : null;
    models.OrdersOrderPayment.findOne = async ({ where }) => {
        if (where.status === 'captured') return { id: 'cap1', amount: '100.00', transactionId: 'txn1', metadata: {} };
        return null; // no duplicate refund
    };
    models.sequelize.transaction = async (cb) => cb({});
    models.OrdersOrderPayment.create = async (d) => ({ id: 'rf1', ...d, toJSON() { return { id: 'rf1', ...d }; } });

    ledgerClient.recordRefund = async (storeId, args) => { ledgerCalls.push({ type: 'REFUND', storeId, args }); return { ok: true }; };
    ledgerClient.recordPaymentCapture = async (storeId, args) => { ledgerCalls.push({ type: 'PAYMENT', storeId, args }); return { ok: true }; };

    // The money paths now mirror to the ledger via the TRANSACTIONAL OUTBOX (committed in the same
    // tx as the refund/capture, then delivered by the relay) rather than calling the ledger client
    // inline. Stub the enqueue so these unit tests assert the durable mirror was recorded.
    ledgerOutbox.enqueueRefund = async (args) => { ledgerCalls.push({ type: 'REFUND', storeId: args.storeId, args }); };
    ledgerOutbox.enqueuePaymentCapture = async (args) => { ledgerCalls.push({ type: 'PAYMENT', storeId: args.storeId, args }); };
});

// ════════════════════ REFUND LIFECYCLE ════════════════════
test('full refund: records a refund row, sets order refunded, mirrors a REFUND ledger entry', async () => {
    const out = await orderService.refundPayment(STORE, 'ord1', { reason: 'customer request' });
    assert.equal(out.status, 'refunded');
    assert.equal(Number(out.amount), 100);
    assert.equal(order.paymentStatus, 'refunded');
    assert.equal(order.status, 'refunded');
    const led = ledgerCalls.find((c) => c.type === 'REFUND');
    assert.ok(led, 'a REFUND entry was posted');
    assert.equal(led.args.refundId, 'rf1');
    assert.equal(Number(led.args.amount), 100);
    assert.equal(led.args.orderId, 'ord1');
});

test('partial refund: order stays partially_paid and is not marked refunded', async () => {
    const out = await orderService.refundPayment(STORE, 'ord1', { amount: 40 });
    assert.equal(Number(out.amount), 40);
    assert.equal(order.paymentStatus, 'partially_paid');
    assert.equal(order.status, 'delivered', 'order status unchanged on partial refund');
});

test('refund rejects an amount exceeding the captured total', async () => {
    assert.equal(await code(() => orderService.refundPayment(STORE, 'ord1', { amount: 250 })), 400);
});

test('refund rejects an unpaid order (409)', async () => {
    order.paymentStatus = 'pending';
    assert.equal(await code(() => orderService.refundPayment(STORE, 'ord1', {})), 409);
});

// ════════════════════ RECONCILIATION REPORT ════════════════════
test('report matches captures present in the ledger and flags refunds missing from it', async () => {
    config.ledger.internalKey = 'recon-test-key'; // enable ledger path
    // The order system has one capture (cap1, $100) and one refund (ref9, $40).
    models.sequelize.query = async () => ([
        { id: 'cap1', orderId: 'ord1', amount: '100.00', currencyCode: 'USD', status: 'captured', transactionId: 'txn1', metadata: {}, orderNumber: 'ORD-1' },
        { id: 'ref9', orderId: 'ord1', amount: '40.00', currencyCode: 'USD', status: 'refunded', transactionId: 'rf', metadata: { refund: true }, orderNumber: 'ORD-1' },
    ]);
    // The ledger has only the PAYMENT entry — the REFUND is missing.
    ledgerClient.listEntries = async (storeId, { entryType }) =>
        entryType === 'PAYMENT'
            ? { ok: true, entries: [{ transactionRef: 'pay-cap1', amount: 10000, entryType: 'PAYMENT', id: 'e1' }] }
            : { ok: true, entries: [] };

    const r = await reconciliation.report(STORE, {});
    assert.equal(r.ledgerAvailable, true);
    assert.equal(r.counts.matched, 1);
    assert.equal(r.counts.missing, 1);
    assert.equal(r.counts.mismatched, 0);
    assert.equal(r.missing[0].transactionRef, 'refund-ref9');
    assert.equal(r.totals.capturedMinor, 10000);
    assert.equal(r.totals.refundedMinor, 4000);
    assert.equal(r.totals.netMinor, 6000);
    assert.equal(r.balanced, false);
    config.ledger.internalKey = ''; // restore
});

test('report reports ledger unavailable when not configured', async () => {
    config.ledger.internalKey = '';
    const r = await reconciliation.report(STORE, {});
    assert.equal(r.ledgerAvailable, false);
    assert.equal(r.reason, 'ledger_not_configured');
});
