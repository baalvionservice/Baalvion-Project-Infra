'use strict';
// Integration tests for customer-ownership enforcement (IDOR defense). These exercise the REAL
// service functions (cartService.getCart, customerService.getCustomer, orderService.getOrder,
// returnService.createReturn) with the data layer + RBAC staff-resolution stubbed. Covers:
//   - owner access succeeds
//   - a different customer is denied (403 + ownership_violation audit)
//   - anonymous (no identity) denied
//   - admin/staff access unchanged (allowed)
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
const { test } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {}; cache.delPattern = async () => {};

const models = require('../models');
const rbacPep = require('../middleware/rbacPep');
const captured = [];
rbacPep.audit.emit = (e) => captured.push(e); // spy on the shared audit emitter (same object ref)

const cartService = require('../service/cartService');
const customerService = require('../service/customerService');
const orderService = require('../service/orderService');
const returnService = require('../service/returnService');

const STORE = 'store-1';
const OWNER = 100; // OrdersCustomer.userId / OrdersCart.userId are BIGINT

// ── stub the data layer (owner = user 100) ──────────────────────────────────────
models.OrdersCart.findOne = async ({ where }) =>
    (where.id === 'cart1' && where.storeId === STORE)
        ? { id: 'cart1', storeId: STORE, userId: OWNER, items: [], discountAmount: 0, toJSON() { return { id: 'cart1', storeId: STORE, userId: OWNER, items: [] }; }, update: async () => {} }
        : null;
models.OrdersCustomer.findOne = async ({ where }) =>
    (where.id === 'cust1' && where.storeId === STORE)
        ? { id: 'cust1', storeId: STORE, userId: OWNER, toJSON() { return { id: 'cust1', storeId: STORE, userId: OWNER }; }, update: async () => {} }
        : null;
models.OrdersCustomer.findByPk = async (id) => (id === 'cust1' ? { userId: OWNER } : null);
models.OrdersOrder.findOne = async ({ where }) =>
    (where.id === 'ord1' && where.storeId === STORE)
        ? { id: 'ord1', storeId: STORE, customerId: 'cust1', status: 'delivered', toJSON() { return { id: 'ord1', storeId: STORE, customerId: 'cust1' }; } }
        : null;
models.OrdersReturn.create = async (d) => ({ ...d, id: 'ret1', toJSON() { return { id: 'ret1', ...d }; } });
if (models.sequelize) models.sequelize.transaction = async (fn) => fn({});

const actor = (userId, isStaff = false) => ({ userId, requestId: 'req-1', isStaff: async () => isStaff });
const OWNER_ACTOR = actor('100');          // JWT sub is a string; ownership compares String===String
const OTHER_ACTOR = actor('200');
const ANON_ACTOR = actor(null);
const ADMIN_ACTOR = actor('999', true);    // store staff/admin

async function status(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }
const lastViolation = () => captured.filter((e) => e.type === 'commerce.ownership_violation').slice(-1)[0];

// ── GET /carts/:id ──────────────────────────────────────────────────────────────
test('cart: owner succeeds, other denied (403 + audit), anon denied, admin allowed', async () => {
    assert.equal(await status(() => cartService.getCart(STORE, 'cart1', OWNER_ACTOR)), 200);
    assert.equal(await status(() => cartService.getCart(STORE, 'cart1', OTHER_ACTOR)), 403);
    const v = lastViolation();
    assert.ok(v && v.decision === 'deny' && v.userId === '200' && v.resource.type === 'cart' && v.reason === 'not_owner');
    assert.equal(await status(() => cartService.getCart(STORE, 'cart1', ANON_ACTOR)), 403);
    assert.equal(await status(() => cartService.getCart(STORE, 'cart1', ADMIN_ACTOR)), 200);
});

// ── GET /customers/:id ──────────────────────────────────────────────────────────
test('customer: owner succeeds, other denied, anon denied, admin allowed', async () => {
    assert.equal(await status(() => customerService.getCustomer(STORE, 'cust1', OWNER_ACTOR)), 200);
    assert.equal(await status(() => customerService.getCustomer(STORE, 'cust1', OTHER_ACTOR)), 403);
    assert.equal(await status(() => customerService.getCustomer(STORE, 'cust1', ANON_ACTOR)), 403);
    assert.equal(await status(() => customerService.getCustomer(STORE, 'cust1', ADMIN_ACTOR)), 200);
});

// ── GET /orders/:id (owner = order's customer's userId) ─────────────────────────
test('order: owner succeeds, other denied, anon denied, admin allowed', async () => {
    assert.equal(await status(() => orderService.getOrder(STORE, 'ord1', OWNER_ACTOR)), 200);
    assert.equal(await status(() => orderService.getOrder(STORE, 'ord1', OTHER_ACTOR)), 403);
    const v = lastViolation();
    assert.ok(v && v.resource.type === 'order' && v.resource.id === 'ord1' && v.action === 'order.read');
    assert.equal(await status(() => orderService.getOrder(STORE, 'ord1', ANON_ACTOR)), 403);
    assert.equal(await status(() => orderService.getOrder(STORE, 'ord1', ADMIN_ACTOR)), 200);
});

// ── POST /returns (must own the order) ──────────────────────────────────────────
test('return: owner of the order succeeds, other denied, admin allowed', async () => {
    const body = { orderId: 'ord1', reason: 'damaged', items: [] };
    assert.equal(await status(() => returnService.createReturn(STORE, body, OWNER_ACTOR)), 200);
    assert.equal(await status(() => returnService.createReturn(STORE, body, OTHER_ACTOR)), 403);
    assert.equal(await status(() => returnService.createReturn(STORE, body, ADMIN_ACTOR)), 200);
});

// ── POST /customers upsert: cannot overwrite another owner's record by email ─────
test('customer upsert: cannot hijack an existing owned record by email; staff/owner can; ownerless claimable', async () => {
    models.OrdersCustomer.findOrCreate = async () => [{ id: 'cust1', storeId: STORE, userId: OWNER, phone: '1', update: async () => {}, toJSON() { return { id: 'cust1' }; } }, false];
    const body = { email: 'owner@x.com', firstName: 'X', lastName: 'Y', userId: '200' };
    assert.equal(await status(() => customerService.upsertCustomer(STORE, body, OTHER_ACTOR)), 403);   // attacker blocked
    assert.equal(await status(() => customerService.upsertCustomer(STORE, { ...body, userId: '100' }, OWNER_ACTOR)), 200); // owner ok
    assert.equal(await status(() => customerService.upsertCustomer(STORE, body, ADMIN_ACTOR)), 200);   // staff ok

    models.OrdersCustomer.findOrCreate = async () => [{ id: 'cust2', storeId: STORE, userId: null, phone: '1', update: async () => {}, toJSON() { return { id: 'cust2' }; } }, false];
    assert.equal(await status(() => customerService.upsertCustomer(STORE, { email: 'guest@x.com', firstName: 'A', userId: '200' }, OTHER_ACTOR)), 200); // ownerless → claimable
});

// ── cross-store IDOR via spoofed storeId is still 404 (store mismatch in the query) ─
test('cross-store id spoofing returns 404 (not data) before ownership even applies', async () => {
    assert.equal(await status(() => cartService.getCart('other-store', 'cart1', OWNER_ACTOR)), 404);
    assert.equal(await status(() => orderService.getOrder('other-store', 'ord1', OWNER_ACTOR)), 404);
});
