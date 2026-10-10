'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const updates = [];
const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
        CommerceProduct: { findOne: async () => ({ id: 'p' }) },
        CommerceProductVariant: { update: async (patch, opts) => { updates.push({ patch, where: opts.where }); } },
        CommerceProductPricing: { findOrCreate: async () => [{ toJSON: () => ({}), update: async () => {} }, true] },
    },
};
const cachePath = path.join(__dirname, '..', 'service', 'cacheService.js');
require.cache[cachePath] = { id: cachePath, filename: cachePath, loaded: true, exports: { del: async () => {}, keys: { product: (id) => `p:${id}` } } };
const { upsertPricing } = require('../service/variantService');

test('a plain price is written to the default variant, which is what the shop and checkout read', async () => {
    updates.length = 0;
    await upsertPricing('s', 'p', null, { price: 1199.5, currencyCode: 'USD' });
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].where, { productId: 'p', isDefault: true });
    assert.equal(updates[0].patch.price, 1199.5);
    assert.equal(updates[0].patch.currencyCode, 'USD');
});

test('a variant-level price updates that variant', async () => {
    updates.length = 0;
    await upsertPricing('s', 'p', 'v1', { price: 20, currencyCode: 'USD', compareAtPrice: 30 });
    assert.deepEqual(updates[0].where, { id: 'v1', productId: 'p' });
    assert.equal(updates[0].patch.compareAtPrice, 30);
});

test('a scheduled or switched-off price never overwrites the live variant price', async () => {
    updates.length = 0;
    await upsertPricing('s', 'p', null, { price: 5, currencyCode: 'USD', startsAt: '2030-01-01T00:00:00.000Z' });
    await upsertPricing('s', 'p', null, { price: 5, currencyCode: 'USD', isActive: false });
    assert.equal(updates.length, 0);
});
