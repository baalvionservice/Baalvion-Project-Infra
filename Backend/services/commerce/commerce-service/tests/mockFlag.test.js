'use strict';
// Auto-promote helper — clears mock markers when a filler product becomes a real listing.

const { test } = require('node:test');
const assert = require('node:assert');
const { isMockProduct, demoteFromMock } = require('../utils/mockFlag');

// Minimal stand-in for a Sequelize CommerceProduct instance.
function fakeProduct({ customFields = {}, tags = [] } = {}) {
    return {
        customFields,
        tags,
        updated: null,
        async update(patch) { Object.assign(this, patch); this.updated = patch; return this; },
    };
}

test('isMockProduct detects isMock, isSample, or the "mock" tag', () => {
    assert.strictEqual(isMockProduct(fakeProduct({ customFields: { isMock: true } })), true);
    assert.strictEqual(isMockProduct(fakeProduct({ customFields: { isSample: true } })), true);
    assert.strictEqual(isMockProduct(fakeProduct({ tags: ['amarise', 'mock'] })), true);
    assert.strictEqual(isMockProduct(fakeProduct({ customFields: { isMock: false }, tags: ['amarise'] })), false);
    assert.strictEqual(isMockProduct(null), false);
});

test('demoteFromMock clears flags + the mock tag, preserving other custom fields/tags', async () => {
    const p = fakeProduct({
        customFields: { isMock: true, isSample: true, basePrice: 1650, brandId: 'amarise-luxe' },
        tags: ['amarise', 'hermes', 'mock'],
    });
    const changed = await demoteFromMock(p);
    assert.strictEqual(changed, true);
    assert.strictEqual(p.customFields.isMock, false);
    assert.strictEqual(p.customFields.isSample, false);
    assert.strictEqual(p.customFields.basePrice, 1650); // untouched
    assert.deepStrictEqual(p.tags, ['amarise', 'hermes']); // only 'mock' removed
});

test('demoteFromMock is a no-op on a non-mock product', async () => {
    const p = fakeProduct({ customFields: { isMock: false }, tags: ['amarise'] });
    const changed = await demoteFromMock(p);
    assert.strictEqual(changed, false);
    assert.strictEqual(p.updated, null); // update() never called
});

test('demoteFromMock promotes a tag-only mock', async () => {
    const p = fakeProduct({ customFields: {}, tags: ['mock'] });
    const changed = await demoteFromMock(p);
    assert.strictEqual(changed, true);
    assert.deepStrictEqual(p.tags, []);
    assert.strictEqual(p.customFields.isMock, false);
});
