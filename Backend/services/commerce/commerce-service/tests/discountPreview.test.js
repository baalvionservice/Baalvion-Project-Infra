'use strict';
// Public storefront discount PREVIEW — anonymous, non-leaky promo-code check. The real
// storefrontService.previewDiscount runs against a stubbed model layer (no DB). Verifies a valid
// code previews a non-leaky { valid, type, amount, eligibility } shape, an invalid/expired code
// yields a clear non-leaky error, admin-only internals are never exposed, and the start/end date
// window is enforced (the [Op.and] fix).
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const models = require('../models');
const storefront = require('../service/storefrontService');

const STORE = 'a0a00000-0000-4000-8000-000000000001';

// A captured query.where so we can assert the date-window predicate is present.
let lastWhere = null;

function discountRow(over = {}) {
    return {
        id: 'd-internal-uuid', name: 'Secret Internal Name', code: 'WELCOME10', type: 'percentage', value: '10',
        minPurchaseAmount: '50', maxDiscountAmount: null, usageLimit: 100, usageCount: 3,
        appliesTo: 'all', targetIds: ['secret-product-id'], startsAt: null, endsAt: null,
        toJSON() { const { toJSON, ...rest } = this; return rest; },
        ...over,
    };
}

beforeEach(() => {
    lastWhere = null;
    models.CommerceStore.findByPk = async (id) => (id === STORE ? { id: STORE } : null);
    models.CommerceDiscount.findOne = async ({ where }) => {
        lastWhere = where;
        return where.code === 'WELCOME10' ? discountRow() : null;
    };
});

test('a valid code previews a non-leaky { valid, type, amount, eligibility } shape', async () => {
    const out = await storefront.previewDiscount(STORE, { code: 'welcome10', orderAmount: 200 });
    assert.equal(out.valid, true);
    assert.equal(out.type, 'percentage');
    assert.equal(out.amount, 20); // 200 * 10%
    assert.equal(out.code, 'WELCOME10');
    assert.deepEqual(out.eligibility, { minPurchaseAmount: 50, appliesTo: 'all' });
});

test('admin-only discount internals are NEVER exposed by the preview', async () => {
    const out = await storefront.previewDiscount(STORE, { code: 'welcome10', orderAmount: 200 });
    for (const leaked of ['id', 'name', 'targetIds', 'usageCount', 'usageLimit', 'value', 'maxDiscountAmount']) {
        assert.equal(out[leaked], undefined, `must not leak ${leaked}`);
    }
});

test('an invalid code yields a clear non-leaky NOT_FOUND error', async () => {
    await assert.rejects(
        () => storefront.previewDiscount(STORE, { code: 'NOPE', orderAmount: 200 }),
        (err) => {
            assert.equal(err.statusCode, 404);
            assert.match(err.message, /Invalid or expired/i);
            return true;
        }
    );
});

test('the lookup enforces BOTH date windows under [Op.and] (start and end checks both present)', async () => {
    await storefront.previewDiscount(STORE, { code: 'welcome10', orderAmount: 200 });
    const andKey = Object.getOwnPropertySymbols(lastWhere).find((s) => s.toString() === 'Symbol(and)');
    assert.ok(andKey, 'where uses [Op.and] to combine the two date windows');
    assert.equal(lastWhere[andKey].length, 2, 'both the start-date and end-date windows are applied');
});

test('a non-existent store 404s before any discount lookup', async () => {
    await assert.rejects(
        () => storefront.previewDiscount('00000000-0000-4000-8000-000000000000', { code: 'welcome10' }),
        (err) => { assert.equal(err.statusCode, 404); return true; }
    );
});
