'use strict';

// Unit tests for the cms-service side of the cross-service entitlement gate. `global.fetch` is
// stubbed so these run with no live imperialpedia-service and no network — the real HTTP call is
// exercised by the full-stack integration run (see docs/local verification), not here.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

let originalFetch;
let fetchCalls;
let fetchImpl;

function loadClient() {
    delete require.cache[require.resolve('../service/entitlementClient')];
    return require('../service/entitlementClient');
}

beforeEach(() => {
    originalFetch = global.fetch;
    fetchCalls = [];
    fetchImpl = async () => { throw new Error('fetchImpl not configured for this test'); };
    global.fetch = (...args) => { fetchCalls.push(args); return fetchImpl(...args); };
});

afterEach(() => {
    global.fetch = originalFetch;
});

test('resolveAccess never calls fetch for non-premium content', async () => {
    const client = loadClient();
    const access = await client.resolveAccess({ userId: 'user-1', isPremiumContent: false });
    assert.equal(access.hasAccess, true);
    assert.equal(fetchCalls.length, 0);
});

test('resolveAccess never calls fetch for an anonymous caller on premium content (denied immediately)', async () => {
    const client = loadClient();
    const access = await client.resolveAccess({ userId: undefined, isPremiumContent: true });
    assert.equal(access.hasAccess, false);
    assert.equal(access.isPremium, true);
    assert.equal(fetchCalls.length, 0);
});

test('resolveAccess grants access when the resolver reports an active paid subscription', async () => {
    fetchImpl = async () => ({
        ok: true,
        json: async () => ({ data: { subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: null } } }),
    });
    const client = loadClient();
    const access = await client.resolveAccess({ userId: 'user-2', isPremiumContent: true });
    assert.equal(access.hasAccess, true);
    assert.equal(fetchCalls.length, 1);
});

test('resolveAccess denies access when the resolver reports no subscription', async () => {
    fetchImpl = async () => ({ ok: true, json: async () => ({ data: { subscription: null } }) });
    const client = loadClient();
    const access = await client.resolveAccess({ userId: 'user-3', isPremiumContent: true });
    assert.equal(access.hasAccess, false);
});

test('resolveAccess FAILS CLOSED (denies) when the resolver is unreachable, never throws', async () => {
    fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
    const client = loadClient();
    const access = await client.resolveAccess({ userId: 'user-4', isPremiumContent: true });
    assert.equal(access.hasAccess, false);
    assert.equal(access.isPremium, true);
});

test('resolveAccess FAILS CLOSED when the resolver responds with a non-2xx status', async () => {
    fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const client = loadClient();
    const access = await client.resolveAccess({ userId: 'user-5', isPremiumContent: true });
    assert.equal(access.hasAccess, false);
});

test('getSubscription caches a positive result and does not re-fetch within the TTL', async () => {
    fetchImpl = async () => ({
        ok: true,
        json: async () => ({ data: { subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: null } } }),
    });
    const client = loadClient();
    const first = await client.getSubscription('user-6');
    const second = await client.getSubscription('user-6');
    assert.deepEqual(first, second);
    assert.equal(fetchCalls.length, 1, 'second call within TTL should be served from cache');
});

test('getSubscription short-circuits to null for an anonymous caller without calling fetch', async () => {
    const client = loadClient();
    const result = await client.getSubscription(undefined);
    assert.equal(result, null);
    assert.equal(fetchCalls.length, 0);
});
