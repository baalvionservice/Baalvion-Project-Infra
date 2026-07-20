'use strict';
// failPayment's payment-failed notification trigger (Priority-1 gap: an async/webhook-driven
// payment failure never notified the shopper by email). I/O collaborators stubbed (no DB/Redis/
// network) — mirrors inventoryReservation.test.js's loadOrderService harness. getProvider() uses
// the REAL mock payment provider (test env, not production) so the provider-call path is real too.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const P = (...p) => require.resolve(path.join(__dirname, '..', ...p));
function inject(absPath, exports) {
    require.cache[absPath] = { id: absPath, filename: absPath, loaded: true, exports };
}

const STORE = 'store-1';
let emailCalls;
let order;

function loadOrderService() {
    emailCalls = [];
    order = {
        id: 'order-1', storeId: STORE, orderNumber: 'ORD-1', totalAmount: '99.00', currencyCode: 'USD',
        paymentStatus: 'pending', metadata: {}, // no inventoryLocks → releaseLocks is a no-op
        update: async function (patch) { Object.assign(this, patch); },
        toJSON: function () { const { update, toJSON, ...rest } = this; return rest; },
    };

    inject(P('service', 'inventoryClient'), {
        async reserve() { return { ok: false, failOpen: true }; },
        async release() { return { ok: true }; },
        async confirm() { return { ok: true }; },
    });
    inject(P('service', 'cacheService'), { get: async () => null, set: async () => {}, del: async () => {}, delPattern: async () => {}, keys: { order: (id) => `order:${id}` } });
    inject(P('service', 'ownership'), { enforce: async () => {}, isOwner: () => true, isSessionOwner: () => true });
    inject(P('service', 'orderNotifications'), {
        sendOrderEmail: async (templateName, orderArg, items) => { emailCalls.push({ templateName, orderId: orderArg && orderArg.id, items }); },
    });
    inject(P('service', 'invoiceService'), { generateInvoiceForOrder: async () => {}, getOrderInvoice: async () => { throw Object.assign(new Error('not found'), { statusCode: 404 }); } });
    inject(P('service', 'pclShadow'), { recordFailure: async () => {}, recordCapture: async () => {} });
    inject(P('service', 'securityAudit'), { payment: () => {} });
    inject(P('service', 'ledgerOutbox'), { enqueuePaymentCapture: async () => {}, enqueueRefund: async () => {} });
    inject(P('service', 'alerts'), { dispatch: async () => {}, inventoryUnavailable: async () => {}, reconciliationDrift: async () => {}, ledgerUnavailable: async () => {}, SEVERITY: {} });

    const OrdersOrder = { async findOne({ where }) { return (where.id === order.id && where.storeId === STORE) ? order : null; } };
    const OrdersOrderPayment = { async update() { return [1]; } };
    const OrdersOrderItem = { async findAll() { return [{ name: 'Vintage Clutch', sku: 'VC-1', quantity: 1, price: '99.00', total: '99.00' }]; } };
    const sequelize = { async transaction(fn) { return fn({}); } };
    inject(P('models'), { OrdersOrder, OrdersOrderPayment, OrdersOrderItem, sequelize });

    delete require.cache[P('service', 'orderService')];
    return require('../service/orderService');
}

beforeEach(() => {});

test('failPayment sends exactly one paymentFailed email, after the order is marked failed', async () => {
    const svc = loadOrderService();
    const result = await svc.failPayment(STORE, 'order-1', 'intent-1', 'card_declined');

    assert.equal(result.paymentStatus, 'failed', 'order marked failed');
    // The email is fired post-commit via a promise chain (OrdersOrderItem.findAll().then(...)) —
    // give the microtask queue a tick so the fire-and-forget resolves before asserting.
    await new Promise((r) => setImmediate(r));

    assert.equal(emailCalls.length, 1, 'exactly one email sent');
    assert.equal(emailCalls[0].templateName, 'paymentFailed');
    assert.equal(emailCalls[0].orderId, 'order-1');
    assert.equal(emailCalls[0].items.length, 1);
});

test('failPayment 404s when the order does not exist (no email sent)', async () => {
    const svc = loadOrderService();
    let thrown;
    try { await svc.failPayment(STORE, 'missing-order', 'intent-1', 'card_declined'); } catch (e) { thrown = e; }
    assert.ok(thrown);
    assert.equal(thrown.statusCode, 404);
    await new Promise((r) => setImmediate(r));
    assert.equal(emailCalls.length, 0);
});
