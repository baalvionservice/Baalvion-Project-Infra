'use strict';
// Guest-order return authorization + customer-link-by-email. Exercises the REAL service functions
// with the data layer + RBAC staff-resolution stubbed (mirrors ownership.test.js).
//   1. A guest (customerId=null) order is returnable by the holder of the matching X-Cart-Session;
//      a different session is 403; staff allowed.
//   2. resolveMyCustomer email-claims a pre-existing unlinked (userId=null) customer on first
//      authed access, then resolves it.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test-secret';

const { test } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {}; cache.delPattern = async () => {};
cache.keys = cache.keys || {}; cache.keys.customer = cache.keys.customer || ((id) => `customer:${id}`);

const models = require('../models');
const rbacPep = require('../middleware/rbacPep');
rbacPep.audit.emit = () => {}; // silence audit

const returnService = require('../service/returnService');
const customerService = require('../service/customerService');

const STORE = 'store-1';
const GUEST_SESSION = 'cs_guest_abc';

async function status(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

// ── 1. Guest-order return authorization ─────────────────────────────────────────
test('guest order: matching session returns succeed; a different session is 403; staff allowed', async () => {
    // A guest order: customerId=null, bound to GUEST_SESSION via metadata.guestSessionId, delivered.
    models.OrdersOrder.findOne = async ({ where }) =>
        (where.id === 'gord1' && where.storeId === STORE)
            ? { id: 'gord1', storeId: STORE, customerId: null, status: 'delivered', metadata: { guestSessionId: GUEST_SESSION } }
            : null;
    models.OrdersOrderItem.findAll = async () => [];
    models.OrdersReturn.create = async (d) => ({ ...d, id: 'gret1', toJSON() { return { id: 'gret1', ...d }; } });
    if (models.sequelize) models.sequelize.transaction = async (fn) => fn({});

    const body = { orderId: 'gord1', reason: 'changed mind', items: [] };
    const guestActor = (sessionId, isStaff = false) => ({ userId: null, sessionId, requestId: 'r', isStaff: async () => isStaff });

    // The original guest (matching signed session) can return.
    assert.equal(await status(() => returnService.createReturn(STORE, body, guestActor(GUEST_SESSION))), 200);
    // A different guest session is denied.
    assert.equal(await status(() => returnService.createReturn(STORE, body, guestActor('cs_other_xyz'))), 403);
    // A guest with NO session is denied.
    assert.equal(await status(() => returnService.createReturn(STORE, body, guestActor(null))), 403);
    // Store staff may return any order.
    assert.equal(await status(() => returnService.createReturn(STORE, body, guestActor('cs_other_xyz', true))), 200);
});

// ── 2. Email-based customer claim/link ──────────────────────────────────────────
test('resolveMyCustomer email-claims a pre-existing unlinked (userId=null) customer, then resolves', async () => {
    const EMAIL = 'shopper@example.com';
    let linkedUserId = null; // the row starts unlinked; the claim stamps userId
    const unlinkedRow = {
        id: 'cust-unlinked', storeId: STORE, get userId() { return linkedUserId; }, email: EMAIL,
        reload: async () => unlinkedRow,
    };

    models.OrdersCustomer.findOne = async ({ where }) => {
        // Primary (storeId,userId) lookup: only matches AFTER the claim stamped userId.
        if (where.userId === 42 && where.email == null) return linkedUserId === 42 ? unlinkedRow : null;
        // Email fallback: the unlinked row (userId:null) with the caller's email.
        if (where.userId === null && where.email === EMAIL.toLowerCase()) return linkedUserId == null ? unlinkedRow : null;
        return null;
    };
    models.OrdersCustomer.update = async (patch, { where }) => {
        if (where.id === 'cust-unlinked' && where.userId === null && patch.userId === 42) { linkedUserId = 42; return [1]; }
        return [0];
    };

    // First authed access: no (storeId,userId) row yet → email-claim links it and resolves.
    const resolved = await customerService.resolveMyCustomer(STORE, 42, EMAIL);
    assert.equal(resolved.id, 'cust-unlinked');
    assert.equal(linkedUserId, 42, 'the unlinked row is now claimed by user 42');

    // A user with neither a linked row nor an email match → 404.
    models.OrdersCustomer.findOne = async () => null;
    assert.equal(await status(() => customerService.resolveMyCustomer(STORE, 99, 'nobody@example.com')), 404);
});
