'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');

// Requiring the runner (not individual files) triggers the SAME registration
// connectors/index.js performs at boot — this is what actually ships, and it
// guarantees every provider (including gsc/adsense/internal_cms from earlier
// phases) is registered regardless of which other test files already ran.
const { registry } = require('../../connectors');
const server = require('../../connectors/server');
const gtm = require('../../connectors/gtm');
const googleNews = require('../../connectors/googleNews');
const clarity = require('../../connectors/clarity');
const metaPixel = require('../../connectors/metaPixel');
const linkedinInsight = require('../../connectors/linkedinInsight');
const pinterestTag = require('../../connectors/pinterestTag');
const tiktokPixel = require('../../connectors/tiktokPixel');
const xPixel = require('../../connectors/xPixel');

const NEW_PROVIDERS = [
    'ga4', 'gtm', 'google-ads', 'merchant-center', 'google-news', 'clarity',
    'bing-webmaster', 'cloudflare', 'meta-pixel', 'linkedin-insight', 'pinterest-tag', 'tiktok-pixel', 'x-pixel', 'server',
];

test('all 17 catalog providers are now implemented (nothing left "soon")', () => {
    const unimplemented = registry.PROVIDER_CATALOG.filter((p) => !registry.get(p.provider));
    assert.deepEqual(unimplemented.map((p) => p.provider), []);
    assert.equal(registry.PROVIDER_CATALOG.length, 17);
});

test('every new connector has the required shape', () => {
    for (const providerId of NEW_PROVIDERS) {
        const c = registry.get(providerId);
        assert.ok(c, `${providerId} not registered`);
        assert.equal(c.provider, providerId);
        assert.equal(typeof c.category, 'string', `${providerId} missing category`);
        assert.ok(Array.isArray(c.requiredCreds), `${providerId} requiredCreds must be an array`);
        assert.equal(typeof c.sync, 'function', `${providerId} missing sync()`);
        assert.equal(typeof c.validate, 'function', `${providerId} missing validate()`);
    }
});

test('every connector with requiredCreds throws validate() when creds are missing', () => {
    for (const providerId of NEW_PROVIDERS) {
        const c = registry.get(providerId);
        if (c.requiredCreds.length === 0) continue; // internal (server) — nothing to validate
        assert.throws(() => c.validate({}), /missing credential/, `${providerId} should throw on empty creds`);
    }
});

test('every connector with requiredCreds passes validate() with all creds present', () => {
    for (const providerId of NEW_PROVIDERS) {
        const c = registry.get(providerId);
        if (c.requiredCreds.length === 0) continue;
        const creds = {};
        for (const k of c.requiredCreds) creds[k] = 'x';
        assert.doesNotThrow(() => c.validate(creds), `${providerId} should not throw with full creds`);
    }
});

test('server connector has no credentials and validates unconditionally', () => {
    assert.deepEqual(server.requiredCreds, []);
    assert.doesNotThrow(() => server.validate());
});

test('server.sync() returns process/infra snapshot metrics', async () => {
    const out = await server.sync();
    assert.ok(Array.isArray(out));
    assert.ok(out.length >= 5);
    const names = out.map((m) => m.metric);
    assert.ok(names.includes('rssMb'));
    assert.ok(names.includes('eventLoopLagMs'));
    for (const m of out) {
        assert.equal(typeof m.value, 'number');
        assert.deepEqual(m.dims, {});
        assert.equal(m.granularity, 'snapshot');
    }
});

test('gtm requires accountId + containerId (not just containerId)', () => {
    assert.ok(gtm.requiredCreds.includes('accountId'));
    assert.ok(gtm.requiredCreds.includes('containerId'));
});

test('google-news requires GSC-style oauth creds, not a bare publicationId', () => {
    assert.deepEqual(googleNews.requiredCreds, ['siteUrl', 'oauthClientId', 'oauthClientSecret', 'refreshToken']);
});

test('pixel-platform connectors require an ad account, not just the pixel id', () => {
    assert.ok(metaPixel.requiredCreds.includes('adAccountId'));
    assert.ok(linkedinInsight.requiredCreds.includes('adAccountId'));
    assert.ok(pinterestTag.requiredCreds.includes('adAccountId'));
    assert.ok(tiktokPixel.requiredCreds.includes('advertiserId'));
});

test('x-pixel requires the full OAuth 1.0a credential set', () => {
    assert.deepEqual(xPixel.requiredCreds, ['apiKey', 'apiSecretKey', 'accessToken', 'accessTokenSecret', 'adAccountId']);
});

test('clarity requires only apiToken (no publicationId/projectId)', () => {
    assert.deepEqual(clarity.requiredCreds, ['apiToken']);
});

test('PROVIDER_CATALOG requiredCreds match the registered connector for every implemented provider', () => {
    for (const entry of registry.PROVIDER_CATALOG) {
        const conn = registry.get(entry.provider);
        assert.deepEqual(entry.requiredCreds, conn.requiredCreds, `catalog/connector mismatch for ${entry.provider}`);
    }
});

// The server.sync() test above touches the shared ioredis client (via
// measureRedisPingMs). Without an explicit teardown, ioredis's background
// reconnect loop (when Redis is unreachable) keeps scheduling timers forever,
// holding the process open long after every assertion has already passed —
// this closes it so the test file actually exits.
after(async () => {
    await require('../../service/analytics/redisClient').closeRedis();
});
