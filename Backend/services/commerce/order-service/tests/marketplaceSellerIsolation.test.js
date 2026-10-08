'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { minStaffLevel, blocksSellerTier } = require('../service/marketplaceAccess');

const MARKET = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

test('on the marketplace store, seller-tier roles are blocked from store-wide order routes', () => {
    assert.equal(blocksSellerTier(MARKET, 80, MARKET), true);   // product_manager (a seller)
    assert.equal(blocksSellerTier(MARKET, 60, MARKET), true);   // ops_manager
    assert.equal(blocksSellerTier(MARKET, 20, MARKET), true);   // store_viewer
    assert.equal(blocksSellerTier(MARKET, 100, MARKET), false); // store_admin / platform admin
});

test('other stores keep the normal capability ladder', () => {
    assert.equal(blocksSellerTier(OTHER, 20, MARKET), false);
    assert.equal(blocksSellerTier(OTHER, 80, MARKET), false);
});

test('"staff" for ownership checks needs full admin only on the marketplace store', () => {
    assert.equal(minStaffLevel(MARKET, MARKET), 100);
    assert.equal(minStaffLevel(OTHER, MARKET), 1);
});

test('an unset store id never matches (guard cannot be tripped by a missing id)', () => {
    assert.equal(blocksSellerTier(undefined, 20, undefined), false);
});

// ── ensureBuyerCustomer ────────────────────────────────────────────────────────────────────────
const created = [];
let existing = null;
let uniqueClash = false;
const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
        OrdersCustomer: {
            findOne: async () => existing,
            create: async (row) => {
                if (uniqueClash) { const e = new Error('dup'); e.name = 'SequelizeUniqueConstraintError'; throw e; }
                created.push(row); return { id: 'new-customer' };
            },
        },
    },
};
const { ensureBuyerCustomer } = require('../service/buyerCustomer');
const addr = { firstName: 'Asha', lastName: 'Rao', email: ' Asha@Example.com ', phone: '+1' };

test('a signed-in buyer without a customer row gets one from the order address', async () => {
    assert.equal(await ensureBuyerCustomer('s', 7, addr), 'new-customer');
    assert.equal(created[0].email, 'asha@example.com');
    assert.equal(created[0].userId, 7);
});

test('an existing customer row for that user is reused, never duplicated', async () => {
    existing = { id: 'old-customer' };
    created.length = 0;
    assert.equal(await ensureBuyerCustomer('s', 7, addr), 'old-customer');
    assert.equal(created.length, 0);
    existing = null;
});

test('an address without a usable email leaves the order unlinked', async () => {
    assert.equal(await ensureBuyerCustomer('s', 7, { firstName: 'A', lastName: 'B' }), null);
    assert.equal(await ensureBuyerCustomer('s', 7, null), null);
});

test('an email already held by another account is not adopted', async () => {
    uniqueClash = true;
    assert.equal(await ensureBuyerCustomer('s', 7, addr), null);
    uniqueClash = false;
});
