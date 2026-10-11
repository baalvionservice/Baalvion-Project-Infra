'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const s = require('../validators/engagementSchemas');
const { pickWinners } = require('../service/engagementService');

const entries = Array.from({ length: 40 }, (_, i) => ({ id: `e${i}`, user_id: `u${i % 10}` }));

test('the same seed always gives the same winners', () => {
    assert.deepStrictEqual(pickWinners('seed-a', entries, 3), pickWinners('seed-a', entries, 3));
});
test('a different seed gives a different order', () => {
    assert.notDeepStrictEqual(pickWinners('seed-a', entries, 5).map((w) => w.id), pickWinners('seed-b', entries, 5).map((w) => w.id));
});
test('one member cannot win twice, however many entries they hold', () => {
    const w = pickWinners('seed-a', entries, 10);
    assert.strictEqual(new Set(w.map((x) => x.userId)).size, w.length);
    assert.deepStrictEqual(w.map((x) => x.position), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});
test('asking for more winners than members returns every member once', () => {
    assert.strictEqual(pickWinners('s', entries, 30).length, 10);
});
test('a draw needs a future closing time and sane limits', () => {
    const ok = { title: 'Monthly ticket', prize: 'Two VIP tickets', entryPoints: 600, maxEntriesPerUser: 5, winnersCount: 2, closesAt: new Date(Date.now() + 86400000).toISOString() };
    assert.ok(s.drawSchema.safeParse(ok).success);
    assert.ok(!s.drawSchema.safeParse({ ...ok, closesAt: new Date(Date.now() - 1000).toISOString() }).success);
    assert.ok(!s.drawSchema.safeParse({ ...ok, winnersCount: 0 }).success);
    assert.ok(s.drawSchema.safeParse({ ...ok, state: 'Maharashtra' }).success);
    assert.ok(s.enterSchema.safeParse({ count: 1, confirmAge: true }).success);
    assert.ok(!s.enterSchema.safeParse({ count: 1 }).success);
    assert.ok(!s.enterSchema.safeParse({ count: 1, confirmAge: false }).success);
});
test('pledges start at 100 points and proposals need a DJ, club and city', () => {
    assert.ok(s.pledgeSchema.safeParse({ points: 100 }).success);
    assert.ok(!s.pledgeSchema.safeParse({ points: 99 }).success);
    assert.ok(!s.pledgeSchema.safeParse({ points: 150.5 }).success);
    assert.ok(s.proposeSchema.safeParse({ djName: 'DJ X', clubName: 'Club Y', city: 'Mumbai' }).success);
    assert.ok(!s.proposeSchema.safeParse({ djName: 'DJ X', clubName: 'Club Y' }).success);
});

test('a paid tier payment names one real tier and a payment method', () => {
    const b = require('../validators/sellerBondSchemas');
    assert.ok(b.startTierSchema.safeParse({ tierSlug: 'global-elite', currency: 'USDT', network: 'TRC20' }).success);
    assert.ok(!b.startTierSchema.safeParse({ tierSlug: 'free-forever', currency: 'USDT' }).success);
    assert.ok(!b.startTierSchema.safeParse({ tierSlug: 'vip-access', currency: 'DOGE' }).success);
});
