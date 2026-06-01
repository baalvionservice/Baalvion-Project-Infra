'use strict';
// SECURITY VALIDATION PASS — break-attempt regression tests for payment authorization, replay,
// duplicate-transaction creation, guest-cart session ownership, session takeover and enumeration.
// Exercises the REAL service functions with the data layer + RBAC staff-resolution stubbed.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test-cart-session-secret';
const { test } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {}; cache.delPattern = async () => {};

const models = require('../models');
const rbacPep = require('../middleware/rbacPep');
const captured = [];
rbacPep.audit.emit = (e) => captured.push(e);

const sessionToken = require('../utils/sessionToken');
const cartService = require('../service/cartService');
const orderService = require('../service/orderService');

const STORE = 'store-1';
const OWNER = 100;
const actor = (userId, isStaff = false, sessionId = null) => ({ userId, sessionId, requestId: 'r', isStaff: async () => isStaff });
async function status(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }
const lastOf = (type) => captured.filter((e) => e.type === type).slice(-1)[0];

// ════════════════════════ SIGNED SESSION TOKEN ════════════════════════
test('session token: round-trips; rejects forged signature and tampered payload', () => {
    const sid = sessionToken.newSessionId();
    const tok = sessionToken.sign(sid);
    assert.equal(sessionToken.verify(tok), sid);                       // valid
    assert.equal(sessionToken.verify(tok.slice(0, -2) + 'xx'), null);  // forged signature → null
    const [p] = tok.split('.');
    assert.equal(sessionToken.verify(`${p}.deadbeef`), null);          // wrong sig
    assert.equal(sessionToken.verify('not-a-token'), null);
    assert.equal(sessionToken.verify(`${Buffer.from('cs_evil').toString('base64url')}.${'A'.repeat(43)}`), null); // spoof attempt
});

// ════════════════════════ GUEST CART OWNERSHIP / TAKEOVER / ENUMERATION ════════════════════════
test('guest cart: only the holder of the signed session can access; takeover & enumeration blocked', async () => {
    const GUEST_SID = 'cs_guest_1';
    models.OrdersCart.findOne = async ({ where }) =>
        (where.id === 'cartG' && where.storeId === STORE)
            ? { id: 'cartG', storeId: STORE, userId: null, sessionId: GUEST_SID, items: [], discountAmount: 0, toJSON() { return { id: 'cartG', storeId: STORE, userId: null, sessionId: GUEST_SID, items: [] }; }, update: async () => {} }
            : null;

    const guestOwner = actor(null, false, GUEST_SID);          // holds the right signed session
    const guestAttacker = actor(null, false, 'cs_attacker');   // forged/other session
    const enumerator = actor(null, false, null);               // knows cartId, no session (enumeration)
    const adminA = actor('999', true);

    assert.equal(await status(() => cartService.getCart(STORE, 'cartG', guestOwner)), 200);   // owner OK
    assert.equal(await status(() => cartService.getCart(STORE, 'cartG', guestAttacker)), 403); // takeover blocked
    assert.ok(lastOf('commerce.ownership_violation').reason === 'session_mismatch');
    assert.equal(await status(() => cartService.getCart(STORE, 'cartG', enumerator)), 403);    // enumeration blocked
    assert.equal(await status(() => cartService.getCart(STORE, 'cartG', adminA)), 200);        // staff OK
    // mutations equally protected
    assert.equal(await status(() => cartService.addItem(STORE, 'cartG', { productId: null, variantId: null, sku: 's', name: 'n', price: 1, quantity: 1 }, guestAttacker)), 403);
});

// ════════════════════════ CLAIM-ON-LOGIN / SAFE MERGE ════════════════════════
test('cart claim: owner of the signed session adopts it; wrong session and unauthenticated denied', async () => {
    let updated = null;
    const make = () => ({ id: 'cartG', storeId: STORE, userId: null, sessionId: 'cs_guest_1', items: [{ productId: 'p', variantId: null, sku: 's', name: 'n', price: 2, quantity: 1 }], discountAmount: 0, toJSON() { return { id: 'cartG', userId: this.userId }; }, update: async (p) => { updated = p; } });
    models.OrdersCart.findOne = async ({ where }) => (where.id === 'cartG' ? make() : null);

    // valid: authenticated user + correct session → adopt (userId set, sessionId cleared)
    assert.equal(await status(() => cartService.claimCart(STORE, 'cartG', actor('100', false, 'cs_guest_1'))), 200);
    assert.deepEqual(updated, { userId: '100', sessionId: null });
    assert.ok(lastOf('commerce.cart_claimed'));

    // wrong session → 403 + claim_denied audit
    assert.equal(await status(() => cartService.claimCart(STORE, 'cartG', actor('100', false, 'cs_wrong'))), 403);
    assert.ok(lastOf('commerce.cart_claim_denied') && lastOf('commerce.cart_claim_denied').reason === 'session_mismatch');

    // guest (no authenticated identity) cannot claim → 401
    assert.equal(await status(() => cartService.claimCart(STORE, 'cartG', actor(null, false, 'cs_guest_1'))), 401);
});

// ════════════════════════ PAYMENT REPLAY / FORGERY / AUTHZ ════════════════════════
test('payment confirm: unknown intent rejected (replay/forgery), non-owner denied, paid-order replay is a no-op', async () => {
    const paidStatus = { v: 'pending' };
    models.OrdersOrder.findOne = async ({ where }) =>
        (where.id === 'ord1' && where.storeId === STORE)
            ? { id: 'ord1', storeId: STORE, customerId: 'cust1', paymentStatus: paidStatus.v, status: 'pending', toJSON() { return { id: 'ord1', paymentStatus: paidStatus.v }; }, update: async () => {} }
            : null;
    models.OrdersCustomer.findByPk = async (id) => (id === 'cust1' ? { userId: OWNER } : null);

    // (a) forged/unknown intent → 409 replay_blocked, never reaches the provider
    models.OrdersOrderPayment.findOne = async () => null;
    assert.equal(await status(() => orderService.confirmPayment(STORE, 'ord1', 'forged-intent', actor('100'))), 409);
    assert.ok(lastOf('commerce.payment_replay_blocked').reason === 'unknown_intent');

    // (b) non-owner is denied by ownership (403) before any payment logic
    models.OrdersOrderPayment.findOne = async () => ({ status: 'pending' });
    assert.equal(await status(() => orderService.confirmPayment(STORE, 'ord1', 'intent-x', actor('200'))), 403);

    // (c) already-paid order → deterministic idempotent replay (no re-capture)
    paidStatus.v = 'paid';
    assert.equal(await status(() => orderService.confirmPayment(STORE, 'ord1', 'intent-x', actor('100'))), 200);
    assert.ok(lastOf('commerce.payment_confirm_replay').reason === 'already_paid');
});

// ════════════════════════ DUPLICATE TRANSACTION CREATION ════════════════════════
test('recordPayment: a duplicate (order, transactionId) is ignored, not double-recorded', async () => {
    models.OrdersOrder.findOne = async ({ where }) => (where.id === 'ord1' ? { id: 'ord1', storeId: STORE, status: 'pending', update: async () => {} } : null);
    models.OrdersOrderPayment.findOne = async ({ where }) => (where.transactionId === 'txn-dupe' ? { id: 'pay-existing', toJSON() { return { id: 'pay-existing' }; } } : null);
    let created = false;
    models.OrdersOrderPayment.create = async () => { created = true; return { toJSON() { return {}; } }; };

    const out = await orderService.recordPayment(STORE, 'ord1', { provider: 'mock', transactionId: 'txn-dupe', amount: 10, currencyCode: 'USD', status: 'captured' });
    assert.equal(out.id, 'pay-existing');
    assert.equal(created, false, 'no second payment row created');
    assert.ok(lastOf('commerce.payment_duplicate').reason === 'duplicate_transaction');
});

// ════════════════════════ NO RAW SESSION-ID EXPOSURE ════════════════════════
test('cart responses never expose the raw sessionId — only the signed token leaves the system', async () => {
    models.OrdersCart.create = async (d) => ({ ...d, id: 'cartN', toJSON() { return { id: 'cartN', storeId: STORE, userId: null, sessionId: d.sessionId, items: [] }; } });
    const created = await cartService.createCart(STORE, { userId: null, currencyCode: 'USD' });
    assert.equal(created.sessionId, undefined, 'createCart hides raw sessionId');
    assert.ok(created.sessionToken && sessionToken.verify(created.sessionToken), 'returns a valid signed token');

    const SID = 'cs_x';
    models.OrdersCart.findOne = async () => ({ id: 'cartN', storeId: STORE, userId: null, sessionId: SID, items: [], discountAmount: 0, toJSON() { return { id: 'cartN', storeId: STORE, userId: null, sessionId: SID, items: [] }; }, update: async () => {} });
    const owner = actor(null, false, SID);
    assert.equal((await cartService.getCart(STORE, 'cartN', owner)).sessionId, undefined, 'getCart hides raw sessionId');
    assert.equal((await cartService.addItem(STORE, 'cartN', { productId: null, variantId: null, sku: 's', name: 'n', price: 1, quantity: 1 }, owner)).sessionId, undefined, 'addItem hides raw sessionId');
});
