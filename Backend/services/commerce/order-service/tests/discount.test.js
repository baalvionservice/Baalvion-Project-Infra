'use strict';
// Discount engine — server-authoritative computation, caps, validation, atomic usage claim.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const models = require('../models');
const discountService = require('../service/discountService');

const STORE = 'store-1';
const T = {}; // fake transaction handle

// Drive applyDiscount by stubbing sequelize.query: the SELECT returns `row`, the UPDATE...RETURNING
// returns `claimRows` (a row = slot claimed, [] = usage exhausted).
function stub(row, claimRows = [{ id: 'd1' }]) {
    models.sequelize.query = async (sql) => {
        if (/FROM commerce\.commerce_discounts/i.test(sql)) return row ? [row] : [];
        if (/UPDATE commerce\.commerce_discounts/i.test(sql)) return claimRows;
        return [];
    };
}
const base = (over = {}) => ({ id: 'd1', code: 'SAVE', type: 'percentage', value: 10, minPurchase: null, maxDiscount: null, usageLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: null, appliesTo: 'all', ...over });
async function code(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

test('no code → zero discount, no lookup', async () => {
    const out = await discountService.applyDiscount(T, STORE, null, 100, 0);
    assert.deepEqual(out, { discountId: null, code: null, type: null, discountAmount: 0 });
});

test('percentage discount computes against subtotal', async () => {
    stub(base({ type: 'percentage', value: 10 }));
    const out = await discountService.applyDiscount(T, STORE, 'SAVE', 100, 0);
    assert.equal(out.discountAmount, 10);
    assert.equal(out.discountId, 'd1');
});

test('fixed_amount is capped at subtotal', async () => {
    stub(base({ type: 'fixed_amount', value: 150 }));
    const out = await discountService.applyDiscount(T, STORE, 'SAVE', 100, 0);
    assert.equal(out.discountAmount, 100);
});

test('free_shipping discounts the shipping amount only', async () => {
    stub(base({ type: 'free_shipping', value: 0 }));
    const out = await discountService.applyDiscount(T, STORE, 'SHIPFREE', 100, 20);
    assert.equal(out.discountAmount, 20);
});

test('maxDiscount caps the computed amount', async () => {
    stub(base({ type: 'percentage', value: 50, maxDiscount: 30 }));
    const out = await discountService.applyDiscount(T, STORE, 'SAVE', 100, 0); // 50 → capped 30
    assert.equal(out.discountAmount, 30);
});

test('rejects unknown / inactive / expired / below-min codes (400)', async () => {
    stub(null);
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'NOPE', 100, 0)), 400);
    stub(base({ isActive: false }));
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'SAVE', 100, 0)), 400);
    stub(base({ endsAt: new Date(Date.now() - 86400000).toISOString() }));
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'SAVE', 100, 0)), 400);
    stub(base({ minPurchase: 200 }));
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'SAVE', 100, 0)), 400);
});

test('rejects unsupported types and item-restricted discounts (400)', async () => {
    stub(base({ type: 'buy_x_get_y' }));
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'BXGY', 100, 0)), 400);
    stub(base({ appliesTo: 'specific_products' }));
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'SAVE', 100, 0)), 400);
});

test('usage limit exhausted → 409 (atomic claim returned no row)', async () => {
    stub(base({ usageLimit: 5, usageCount: 5 }), []); // claim UPDATE affects nothing
    assert.equal(await code(() => discountService.applyDiscount(T, STORE, 'SAVE', 100, 0)), 409);
});
