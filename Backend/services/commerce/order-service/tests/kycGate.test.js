'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertKycForItems } = require('../service/kycGate');

const ENV = { KYC_SERVICE_URL: 'http://community:3064/api/v1/community', INTERNAL_SERVICE_SECRET: 's3cret' };
const plain = [{ productId: 'a', requiresKyc: false }];
const gated = [{ productId: 'a', requiresKyc: false }, { productId: 'b', requiresKyc: true }];
const user = { userId: '11111111-1111-4111-8111-111111111111' };
const reply = (data, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => ({ data }) });
const never = async () => { throw new Error('network must not be touched'); };

test('carts with no flagged item never touch the network and pass for guests', async () => {
    await assertKycForItems(plain, { userId: null }, { fetchImpl: never, env: {} });
    await assertKycForItems([], null, { fetchImpl: never, env: {} });
});

test('a flagged item requires a signed-in buyer', async () => {
    await assert.rejects(() => assertKycForItems(gated, { userId: null }, { fetchImpl: never, env: ENV }), (e) => e.code === 'KYC_REQUIRED' && e.statusCode === 403);
});

test('approved buyers pass and the lookup carries the internal secret', async () => {
    let seen;
    await assertKycForItems(gated, user, {
        env: ENV,
        fetchImpl: async (url, init) => { seen = { url, secret: init.headers['x-internal-secret'] }; return { ok: true, json: async () => ({ data: { approved: true, status: 'approved' } }) }; },
    });
    assert.equal(seen.secret, 's3cret');
    assert.match(seen.url, /\/internal\/kyc\/11111111-1111-4111-8111-111111111111$/);
});

test('unverified, pending, rejected and expired buyers are refused with their status', async () => {
    for (const status of ['none', 'submitted', 'rejected', 'expired']) {
        await assert.rejects(
            () => assertKycForItems(gated, user, { env: ENV, fetchImpl: reply({ approved: false, status }) }),
            (e) => e.code === 'KYC_REQUIRED' && e.statusCode === 403 && e.details.kycStatus === status,
        );
    }
});

test('fails closed when the lookup is unconfigured, errors, or times out', async () => {
    await assert.rejects(() => assertKycForItems(gated, user, { env: {}, fetchImpl: never }), (e) => e.code === 'KYC_UNAVAILABLE' && e.statusCode === 503);
    await assert.rejects(() => assertKycForItems(gated, user, { env: ENV, fetchImpl: reply({}, false) }), (e) => e.code === 'KYC_UNAVAILABLE');
    await assert.rejects(() => assertKycForItems(gated, user, { env: ENV, fetchImpl: async () => { throw new Error('timeout'); } }), (e) => e.code === 'KYC_UNAVAILABLE');
});

test('only an explicit approved:true passes', async () => {
    await assert.rejects(() => assertKycForItems(gated, user, { env: ENV, fetchImpl: reply({ approved: 'yes' }) }), (e) => e.code === 'KYC_REQUIRED');
    await assert.rejects(() => assertKycForItems(gated, user, { env: ENV, fetchImpl: reply(null) }), (e) => e.code === 'KYC_REQUIRED');
});
