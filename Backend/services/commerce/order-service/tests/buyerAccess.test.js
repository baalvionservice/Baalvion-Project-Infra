'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: { sequelize: { query: async () => [] } } };
const config = require('../config/appConfig');
const { assertCanBuy } = require('../service/buyerAccess');

const MARKET = config.marketplace.storeId;
const OTHER = '99999999-9999-4999-8999-999999999999';
const rowsFor = (rows) => async () => rows;
const never = async () => { throw new Error('database must not be touched'); };

test('other stores are untouched by the access pass', async () => {
    await assertCanBuy(OTHER, { userId: null, roles: [] }, { query: never });
    await assertCanBuy(OTHER, { userId: 5, roles: [] }, { query: never });
});

test('on the marketplace, guests must sign in', async () => {
    await assert.rejects(assertCanBuy(MARKET, { userId: null, roles: [] }, { query: never }), (e) => e.code === 'UNAUTHORIZED' && e.statusCode === 401);
});

test('platform admins buy without a pass', async () => {
    await assertCanBuy(MARKET, { userId: 2, roles: ['super_admin'] }, { query: never });
});

test('a member with an active pass (or an active seller category) may buy', async () => {
    await assertCanBuy(MARKET, { userId: 7, roles: ['owner'] }, { query: rowsFor([{ '?column?': 1 }]) });
});

test('everyone else gets 402 and the price', async () => {
    await assert.rejects(assertCanBuy(MARKET, { userId: 7, roles: ['owner'] }, { query: rowsFor([]) }), (e) => e.code === 'ACCESS_PASS_REQUIRED' && e.statusCode === 402 && e.details.priceUsd === 50);
});
