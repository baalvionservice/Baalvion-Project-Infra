'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
let owner = null;
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: { CommerceProduct: { findOne: async () => (owner ? { id: 'p', createdBy: owner } : null) } },
};
const config = require('../config/appConfig');
const g = require('../middleware/marketplaceGuard');

const MARKET = config.marketplace.defaultStoreId;
const OTHER = '99999999-9999-4999-8999-999999999999';
const PID = '11111111-1111-4111-8111-111111111111';
const run = (mw, req) => new Promise((resolve) => mw(req, {}, (err) => resolve(err || null)));
const req = (over = {}) => ({ params: { storeId: MARKET, productId: PID }, storeLevel: 80, auth: { userId: 7 }, body: {}, ...over });

test('a seller-tier role on the marketplace is a seller; full admin and other stores are not', () => {
    assert.equal(g.isMarketplaceSeller(req()), true);
    assert.equal(g.isMarketplaceSeller(req({ storeLevel: 100 })), false);
    assert.equal(g.isMarketplaceSeller(req({ params: { storeId: OTHER } })), false);
});

test('platform-only routes refuse sellers on the marketplace and nobody else', async () => {
    const e = await run(g.adminOnlyOnMarketplace, req());
    assert.equal(e.statusCode, 403);
    assert.equal(await run(g.adminOnlyOnMarketplace, req({ storeLevel: 100 })), null);
    assert.equal(await run(g.adminOnlyOnMarketplace, req({ params: { storeId: OTHER } })), null);
});

test('a seller reads only their own product; someone else\'s looks like it does not exist', async () => {
    owner = '7';
    assert.equal(await run(g.ownProductOnMarketplace, req()), null);
    owner = '8';
    const e = await run(g.ownProductOnMarketplace, req());
    assert.equal(e.statusCode, 404);
    owner = null;
    assert.equal((await run(g.ownProductOnMarketplace, req())).statusCode, 404);
});

test('admins and other stores bypass the ownership check', async () => {
    owner = '8';
    assert.equal(await run(g.ownProductOnMarketplace, req({ storeLevel: 100 })), null);
    assert.equal(await run(g.ownProductOnMarketplace, req({ params: { storeId: OTHER, productId: PID } })), null);
});

test('a slug or garbage id is treated as not found, never sent to the database', async () => {
    owner = '7';
    assert.equal((await run(g.ownProductOnMarketplace, req({ params: { storeId: MARKET, productId: 'phone-x' } }))).statusCode, 404);
});

test('sellers can reply to reviews but not change their status', async () => {
    assert.equal(await run(g.sellerCannotModerate, req({ body: { reply: 'Thanks!' } })), null);
    assert.equal((await run(g.sellerCannotModerate, req({ body: { status: 'approved' } }))).statusCode, 403);
    assert.equal(await run(g.sellerCannotModerate, req({ storeLevel: 100, body: { status: 'approved' } })), null);
});
