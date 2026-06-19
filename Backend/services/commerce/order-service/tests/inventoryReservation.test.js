'use strict';
// Pure unit test for the cross-service inventory reservation wired into createOrder. No Postgres,
// no Redis, no network: the heavy collaborators (../models and the I/O services) are replaced in
// require.cache with in-memory stubs BEFORE orderService is required (mirrors discount.test.js +
// the inventory-service reservation.test.js stubbing style). inventoryClient is the unit under
// test's seam — we control whether reserve() succeeds, 409-conflicts, or fail-opens.
//
// Asserts the two policy-critical behaviors:
//   (a) a 409 from reserve makes createOrder REJECT (409 OUT_OF_STOCK) AND releases prior holds.
//   (b) inventory disabled OR unreachable → createOrder still SUCCEEDS (fail-open).
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';
process.env.FX_LIVE_FEED = 'false';
// Default ON for the conflict/fail-open tests; the disabled test toggles it via the config stub.
process.env.INVENTORY_INTERNAL_KEY = process.env.INVENTORY_INTERNAL_KEY || 'test-inventory-key';

const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const P = (...p) => require.resolve(path.join(__dirname, '..', ...p));

// ── Recorded calls (assertions read these) ──────────────────────────────────────
let reserveCalls;   // [{ storeId, key, quantity }]
let releaseCalls;   // [lockId]
let confirmCalls;   // [lockId]
let createdOrders;  // in-memory order rows
let cancelledOrders;

// inventoryClient script: an array of results returned in order, one per reserve() call.
let reserveScript;

function makeModelsStub() {
    let idSeq = 1;
    const orderRow = () => null;

    const OrdersOrder = {
        async create(data) {
            const row = {
                id: `order-${idSeq++}`,
                ...data,
                metadata: { ...(data.metadata || {}) },
                async update(patch) { Object.assign(this, patch); if (patch.status === 'cancelled') cancelledOrders.push(this.id); },
                toJSON() { const { update, toJSON, ...rest } = this; return rest; },
            };
            createdOrders.push(row);
            return row;
        },
        async findOne({ where }) {
            const row = createdOrders.find((o) => o.id === (where && where.id));
            return row || null;
        },
        async findByPk(id) { return createdOrders.find((o) => o.id === id) || null; },
    };
    const OrdersOrderItem = {
        async bulkCreate() { return []; },
        async findAll() { return []; },
    };
    const OrdersOrderPayment = { async findOne() { return null; }, async create(d) { return d; } };
    const OrdersInvoice = {};
    const OrdersCustomer = { async findOne() { return null; }, async findByPk() { return null; }, async increment() {}, async update() {} };

    // sequelize: resolveAuthoritativeItems issues 3 SELECTs/item (product, variant, pricing);
    // reserveInventory issues a SELECT ... FOR UPDATE (return [] → "untracked", allowed). The
    // idempotency probe (metadata->>'idempotencyKey') only runs when an idempotencyKey is sent.
    const sequelize = {
        async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }); },
        async query(sql) {
            if (/FROM commerce\.commerce_products\b/i.test(sql)) return [{ id: 'p1', name: 'Lux Bag', status: 'published', store_id: 'store-1' }];
            if (/FROM commerce\.commerce_product_variants\b/i.test(sql)) return [{ id: 'v1', sku: 'LUX-BAG-0001', name: 'Default', price: 5000, is_active: true }];
            if (/FROM commerce\.commerce_product_pricing\b/i.test(sql)) return [{ price: 5000, tax_rate: 0 }];
            if (/inventory\.inventory_stock/i.test(sql)) return []; // in-DB reserve: untracked → allow
            return [];
        },
    };

    return { OrdersOrder, OrdersOrderItem, OrdersOrderPayment, OrdersInvoice, OrdersCustomer, sequelize };
}

// Replace a module in the require cache with a stub export.
function inject(absPath, exports) {
    require.cache[absPath] = { id: absPath, filename: absPath, loaded: true, exports };
}

function loadOrderService({ inventoryEnabled = true } = {}) {
    // Stub the inventory HTTP client (the seam under test).
    inject(P('service', 'inventoryClient'), {
        async reserve(storeId, { variantId, sku, quantity }) {
            const key = variantId || sku;
            reserveCalls.push({ storeId, key, quantity });
            const next = reserveScript.shift();
            return next || { ok: false, failOpen: true };
        },
        async release(storeId, lockId) { releaseCalls.push(lockId); return { ok: true }; },
        async confirm(storeId, lockId, orderId) { confirmCalls.push(lockId); return { ok: true }; },
    });
    // Stub the I/O collaborators so nothing touches Redis/DB/network.
    inject(P('service', 'cacheService'), { get: async () => null, set: async () => {}, del: async () => {}, delPattern: async () => {}, keys: { order: (id) => `order:${id}` } });
    inject(P('service', 'ownership'), { enforce: async () => {}, isOwner: () => true, isSessionOwner: () => true });
    inject(P('service', 'fxRateProvider'), { primeFromCache: async () => {}, get: () => 1 });
    inject(P('service', 'orderNotifications'), { sendOrderEmail: async () => {} });
    inject(P('service', 'ledgerOutbox'), { enqueuePaymentCapture: async () => {}, enqueueRefund: async () => {} });
    inject(P('service', 'securityAudit'), { payment: () => {} });
    inject(P('service', 'alerts'), { dispatch: async () => {}, inventoryUnavailable: async () => {}, reconciliationDrift: async () => {}, ledgerUnavailable: async () => {}, SEVERITY: {} });
    inject(P('models'), makeModelsStub());

    // appConfig with inventory.enabled toggled (avoids requireEnv('JWT_PUBLIC_KEY') side effects too).
    inject(P('config', 'appConfig'), {
        env: 'test',
        cache: { orderTtl: 1 },
        inventory: { baseUrl: 'http://localhost:3014', apiPrefix: '/api/v1', internalKey: inventoryEnabled ? 'k' : '', timeoutMs: 4000, get enabled() { return !!this.internalKey; } },
    });

    delete require.cache[P('service', 'orderService')];
    return require('../service/orderService');
}

const STORE = 'store-1';
const ITEM = { productId: '11111111-1111-1111-1111-111111111111', quantity: 1 };
const ACTOR = { userId: 'user-9' };
const BODY = () => ({ items: [{ ...ITEM }], shippingAmount: 0 });

beforeEach(() => {
    reserveCalls = []; releaseCalls = []; confirmCalls = [];
    createdOrders = []; cancelledOrders = []; reserveScript = [];
});

async function statusOf(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

// (a) 409 from reserve → createOrder rejects AND releases prior holds.
test('a 409 conflict on reserve fails the order (409 OUT_OF_STOCK) and releases prior holds', async () => {
    const svc = loadOrderService({ inventoryEnabled: true });
    // Two-line order: line 1 reserves OK (lockId), line 2 conflicts → must release line 1's lock.
    reserveScript = [
        { ok: true, lockId: 'lock-A', status: 201 },
        { ok: false, conflict: true, status: 409, detail: { available: 0, requested: 1 } },
    ];
    const body = { items: [{ ...ITEM }, { ...ITEM }], shippingAmount: 0 };

    let thrown;
    try { await svc.createOrder(STORE, body, ACTOR); } catch (e) { thrown = e; }
    assert.ok(thrown, 'createOrder threw');
    assert.equal(thrown.statusCode, 409, '409');
    assert.equal(thrown.code, 'OUT_OF_STOCK', 'OUT_OF_STOCK');
    assert.equal(reserveCalls.length, 2, 'attempted both lines');
    assert.deepEqual(releaseCalls, ['lock-A'], 'the prior hold from line 1 was released');
    // The committed order was compensating-cancelled (so no placed-but-unfulfillable order remains).
    assert.equal(cancelledOrders.length, 1, 'committed order was cancelled');
});

// (b1) inventory DISABLED → createOrder succeeds (fail-open), no reserve attempted.
test('inventory disabled → createOrder still succeeds (fail-open), no reservation attempted', async () => {
    const svc = loadOrderService({ inventoryEnabled: false });
    const order = await svc.createOrder(STORE, BODY(), ACTOR);
    assert.ok(order && order.id, 'order created');
    assert.equal(reserveCalls.length, 0, 'no reserve attempted when disabled');
    assert.equal(releaseCalls.length, 0);
    assert.equal(cancelledOrders.length, 0, 'order not cancelled');
});

// (b2) inventory UNREACHABLE (fail-open result) → createOrder succeeds, no hard fail, no locks recorded.
test('inventory unreachable → createOrder still succeeds (fail-open)', async () => {
    const svc = loadOrderService({ inventoryEnabled: true });
    reserveScript = [{ ok: false, failOpen: true, error: 'ECONNREFUSED' }];
    const order = await svc.createOrder(STORE, BODY(), ACTOR);
    assert.ok(order && order.id, 'order created despite inventory outage');
    assert.equal(reserveCalls.length, 1, 'reserve was attempted');
    assert.equal(releaseCalls.length, 0, 'nothing to release (no hold taken)');
    assert.equal(cancelledOrders.length, 0, 'order not cancelled on a fail-open outage');
});

// Happy path: a successful hold is recorded on order.metadata.inventoryLocks.
test('a successful reserve records the lock on order.metadata.inventoryLocks', async () => {
    const svc = loadOrderService({ inventoryEnabled: true });
    reserveScript = [{ ok: true, lockId: 'lock-XYZ', status: 201 }];
    const order = await svc.createOrder(STORE, BODY(), ACTOR);
    assert.ok(order.metadata && Array.isArray(order.metadata.inventoryLocks), 'inventoryLocks recorded');
    assert.equal(order.metadata.inventoryLocks.length, 1);
    assert.equal(order.metadata.inventoryLocks[0].lockId, 'lock-XYZ');
    assert.equal(order.metadata.inventoryLocks[0].sku, 'LUX-BAG-0001');
});
