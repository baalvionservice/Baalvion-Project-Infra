'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const cats = {
    root: { id: 'root', parentId: null },
    phones: { id: 'phones', parentId: 'root' },
    other: { id: 'other', parentId: null },
};
let approved = true;
let activeBondFor = null;

const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
        CommerceCategory: { findByPk: async (id) => cats[id] || null },
        CommerceSellerApplication: { findOne: async () => (approved ? { id: 'app' } : null) },
        CommerceSellerCategoryBond: { findOne: async ({ where }) => (activeBondFor === where.categoryId ? { id: 'b' } : null) },
        CommerceProduct: {},
    },
};
const svc = require('../service/sellerBondService');

test('sub-category is covered by its root category deposit', async () => {
    activeBondFor = 'root';
    await svc.assertCanSellInCategory(7, 'phones');
});

test('a deposit for one category does not cover another', async () => {
    activeBondFor = 'root';
    await assert.rejects(svc.assertCanSellInCategory(7, 'other'), (e) => e.code === 'DEPOSIT_REQUIRED' && e.statusCode === 402);
});

test('listing without a category is rejected for sellers', async () => {
    await assert.rejects(svc.assertCanSellInCategory(7, null), (e) => e.code === 'VALIDATION_ERROR');
});

test('users who never applied as sellers (staff/admins) are not gated', async () => {
    approved = false;
    await svc.assertCanSellInCategory(1, 'other');
    approved = true;
});
