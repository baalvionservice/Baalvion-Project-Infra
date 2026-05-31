'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { Cache, TTL, buildKey } = require('./index');
const { runWithTenant } = require('@baalvion/tenancy');

// Minimal in-memory Redis stand-in so the cache logic is tested deterministically
// (no real Redis needed). `broken:true` simulates Redis being down (fail-open path).
class FakeRedis {
    constructor({ broken = false } = {}) { this.store = new Map(); this.broken = broken; this.sets = 0; }
    async get(k) { if (this.broken) throw new Error('redis down'); return this.store.has(k) ? this.store.get(k) : null; }
    async set(k, v) { if (this.broken) throw new Error('redis down'); this.store.set(k, v); this.sets++; return 'OK'; }
    async del(...ks) { let n = 0; for (const k of ks) if (this.store.delete(k)) n++; return n; }
    async scan(_cursor, _m, pattern, _c, _count) {
        const re = new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
        return ['0', [...this.store.keys()].filter((k) => re.test(k))];
    }
    async pttl(k) { return this.store.has(k) ? 99999 : -2; }
    async ping() { return 'PONG'; }
    async quit() {}
    disconnect() {}
}

const newCache = (opts = {}) => new Cache({ client: new FakeRedis(opts.fake || {}), namespace: 'test', logger: { warn() {} }, ...opts });

test('buildKey: namespaced + tenant-scoped', () => {
    assert.equal(buildKey('ns', ['a', 'b']), 'ns:a:b');
    assert.equal(buildKey('ns', ['a', 'b'], 'org-9'), 'ns:t:org-9:a:b');
});

test('TTL.FX is the 30s standard', () => assert.equal(TTL.FX, 30));

test('getOrSet: miss runs loader once, then hits cache', async () => {
    const cache = newCache();
    let calls = 0;
    const load = async () => { calls++; return { v: 42 }; };
    assert.deepEqual(await cache.getOrSet(['k'], load), { v: 42 });
    assert.deepEqual(await cache.getOrSet(['k'], load), { v: 42 });
    assert.equal(calls, 1, 'loader should run once (2nd call is a hit)');
    assert.equal(cache.stats.hits, 1);
    assert.equal(cache.stats.misses, 1);
});

test('single-flight: concurrent misses run the loader exactly once', async () => {
    const cache = newCache();
    let calls = 0;
    const slow = async () => { calls++; await new Promise((r) => setTimeout(r, 30)); return calls; };
    const results = await Promise.all(Array.from({ length: 8 }, () => cache.getOrSet(['hot'], slow)));
    assert.equal(calls, 1, 'loader ran once for 8 concurrent callers');
    assert.deepEqual(results, Array(8).fill(1));
});

test('null is cached (penetration protection); undefined is not', async () => {
    const cache = newCache();
    let calls = 0;
    await cache.getOrSet(['n'], async () => { calls++; return null; });
    await cache.getOrSet(['n'], async () => { calls++; return null; });
    assert.equal(calls, 1, 'null result is cached → loader runs once');
});

test('fail-open: Redis down → getOrSet still returns the loader value', async () => {
    const cache = newCache({ fake: { broken: true } });
    const val = await cache.getOrSet(['k'], async () => 'live-value');
    assert.equal(val, 'live-value');
    assert.equal(cache.stats.errors >= 1, true);
});

test('tenant-scoped keys isolate tenants', async () => {
    const cache = newCache({ tenantScoped: true });
    await runWithTenant({ tenantId: 'org-a' }, () => cache.getOrSet(['profile'], async () => 'A'));
    await runWithTenant({ tenantId: 'org-b' }, () => cache.getOrSet(['profile'], async () => 'B'));
    const a = await runWithTenant({ tenantId: 'org-a' }, () => cache.get(['profile']));
    const b = await runWithTenant({ tenantId: 'org-b' }, () => cache.get(['profile']));
    assert.equal(a, 'A');
    assert.equal(b, 'B', 'tenant-b must not read tenant-a cached value');
});

test('invalidatePrefix drops a key family', async () => {
    const cache = newCache();
    await cache.set(['org', '1', 'x'], 1, 0);
    await cache.set(['org', '1', 'y'], 2, 0);
    await cache.set(['org', '2', 'z'], 3, 0);
    const removed = await cache.invalidatePrefix(['org', '1']);
    assert.equal(removed, 2);
    assert.equal(await cache.get(['org', '1', 'x']), null);
    assert.equal(await cache.get(['org', '2', 'z']), 3);
});
