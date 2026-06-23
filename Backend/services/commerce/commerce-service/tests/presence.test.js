'use strict';
// Live-presence service — heartbeat dedupe, windowed pruning, read-only count, and
// fail-soft behaviour when Redis is down. Runs with an in-memory fake Redis (no server).

// Short window so the prune test is fast/deterministic. Must be set BEFORE the service loads.
process.env.PRESENCE_WINDOW_MS = '10000';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
const presence = require('../service/presenceService');

// ── In-memory fake ioredis: just the sorted-set ops the service uses, via multi().exec() ──
function makeFakeRedis() {
    const store = new Map(); // key -> Map<member, scoreMs>
    const ensure = (k) => { if (!store.has(k)) store.set(k, new Map()); return store.get(k); };
    return {
        _store: store,
        multi() {
            const queue = [];
            const b = {
                zadd(key, score, member) { queue.push(() => { ensure(key).set(member, Number(score)); return 1; }); return b; },
                zremrangebyscore(key, min, max) {
                    queue.push(() => {
                        const lo = min === '-inf' ? -Infinity : Number(min);
                        const hi = max === '+inf' ? Infinity : Number(max);
                        const m = ensure(key); let removed = 0;
                        for (const [mem, sc] of [...m]) { if (sc >= lo && sc <= hi) { m.delete(mem); removed++; } }
                        return removed;
                    });
                    return b;
                },
                // Our cap range (0..-(MAX+1)) is empty for small sets — match real Redis: no-op.
                zremrangebyrank() { queue.push(() => 0); return b; },
                pexpire() { queue.push(() => 1); return b; },
                zcard(key) { queue.push(() => ensure(key).size); return b; },
                async exec() { return queue.map((fn) => { try { return [null, fn()]; } catch (e) { return [e]; } }); },
            };
            return b;
        },
    };
}

const realGetClient = cache.getClient;
let realNow;
beforeEach(() => {
    cache.getClient = () => makeFakeRedis.current;
    makeFakeRedis.current = makeFakeRedis();
    realNow = Date.now;
});
afterEach(() => {
    Date.now = realNow;
    cache.getClient = realGetClient; // don't leak the fake into other suites
});

test('heartbeat counts a single visitor once (dedupe by visitorId)', async () => {
    const a1 = await presence.heartbeat('store-1', 'visitor-a');
    assert.strictEqual(a1.count, 1);
    const a2 = await presence.heartbeat('store-1', 'visitor-a'); // same tab pings again
    assert.strictEqual(a2.count, 1);
    const b1 = await presence.heartbeat('store-1', 'visitor-b'); // a second tab
    assert.strictEqual(b1.count, 2);
});

test('presence is isolated per store', async () => {
    await presence.heartbeat('store-1', 'v1');
    await presence.heartbeat('store-2', 'v2');
    assert.strictEqual((await presence.count('store-1')).count, 1);
    assert.strictEqual((await presence.count('store-2')).count, 1);
});

test('stale visitors fall out of the count after the window elapses', async () => {
    const t0 = 1_000_000;
    Date.now = () => t0;
    await presence.heartbeat('store-1', 'old');
    assert.strictEqual((await presence.count('store-1')).count, 1);

    // Jump past the 10s window — the old beat must be pruned on the next read.
    Date.now = () => t0 + 10_001;
    assert.strictEqual((await presence.count('store-1')).count, 0);
});

test('count() is read-only (does not register a visitor)', async () => {
    assert.strictEqual((await presence.count('store-1')).count, 0);
    // No visitor MEMBER should have been added by a read (real Redis ZCARD on a missing key
    // returns 0 without creating it; we assert on members, not key existence).
    const set = makeFakeRedis.current._store.get('commerce:presence:store-1');
    assert.strictEqual(set ? set.size : 0, 0);
});

test('invalid input is rejected without touching Redis', async () => {
    assert.deepStrictEqual(await presence.heartbeat('', 'v'), { count: 0 });
    assert.deepStrictEqual(await presence.heartbeat('store-1', ''), { count: 0 });
    assert.deepStrictEqual(await presence.count(''), { count: 0 });
});

test('fails soft to 0 when Redis throws', async () => {
    cache.getClient = () => { throw new Error('redis down'); };
    assert.deepStrictEqual(await presence.heartbeat('store-1', 'v'), { count: 0 });
    assert.deepStrictEqual(await presence.count('store-1'), { count: 0 });
});
