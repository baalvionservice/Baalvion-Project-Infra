'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { MIN, MAX, randomMemberNumber, formatMemberNumber, parseMemberNumber, profilePath } = require('../utils/memberId');

test('member numbers are always 8 digits and formatted HR-…', () => {
    for (const r of [0, 0.5, 0.999999999]) {
        const n = randomMemberNumber(() => r);
        assert.ok(n >= MIN && n <= MAX);
        assert.match(formatMemberNumber(n), /^HR-\d{8}$/);
    }
    assert.equal(randomMemberNumber(() => 0), MIN);
});

test('parseMemberNumber accepts HR- prefix in any case, rejects everything else', () => {
    assert.equal(parseMemberNumber('HR-48291736'), 48291736);
    assert.equal(parseMemberNumber('hr-48291736'), 48291736);
    assert.equal(parseMemberNumber('48291736'), 48291736);
    for (const bad of ['', null, undefined, 'HR-123', '1234567', '123456789', 'HR-4829173a', '../etc', "1; drop table"]) assert.equal(parseMemberNumber(bad), null);
});

test('profile URL carries a readable name but identity is the number', () => {
    assert.equal(profilePath(48291736, 'Seller One Mobiles'), '/u/HR-48291736/seller-one-mobiles');
    assert.equal(profilePath(48291736, 'Asha R.'), '/u/HR-48291736/asha-r');
    assert.equal(profilePath(48291736, '***'), '/u/HR-48291736/member');
    assert.ok(profilePath(48291736, 'x'.repeat(300)).split('/')[3].length <= 60);
});

// ── service logic with stubbed models ────────────────────────────────────────────────────────────
const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
const store = new Map();
let collideOnce = false;
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
        sequelize: { query: async () => [] },
        CommerceSellerApplication: { findOne: async () => null },
        CommerceMemberProfile: {
            findByPk: async (id) => store.get(String(id)) || null,
            create: async (row) => {
                if (collideOnce) { collideOnce = false; const e = new Error('dup'); e.name = 'SequelizeUniqueConstraintError'; throw e; }
                const rec = { ...row, createdAt: new Date() }; store.set(String(row.userId), rec); return rec;
            },
        },
    },
};
const svc = require('../service/memberService');

test('a member keeps the same number on every call', async () => {
    const a = await svc.ensureProfile(5); const b = await svc.ensureProfile(5);
    assert.equal(a.memberNumber, b.memberNumber);
});

test('a number collision is retried, not surfaced', async () => {
    collideOnce = true;
    const p = await svc.ensureProfile(6);
    assert.ok(p.memberNumber >= MIN);
});

test('summariseSales counts only paid, uncancelled orders and sums revenue per currency', () => {
    const s = svc.summariseSales([
        { status: 'confirmed', paymentStatus: 'paid', currency: 'USD', mine: 100.1, rated: false },
        { status: 'shipped', paymentStatus: 'paid', currency: 'USD', mine: 50.2, rated: false },
        { status: 'delivered', paymentStatus: 'paid', currency: 'USD', mine: 25, rated: false },
        { status: 'delivered', paymentStatus: 'paid', currency: 'INR', mine: 900, rated: true },
        { status: 'cancelled', paymentStatus: 'paid', currency: 'USD', mine: 999, rated: false },
        { status: 'pending', paymentStatus: 'pending', currency: 'USD', mine: 777, rated: false },
    ]);
    assert.deepEqual(s.revenue, { USD: 175.3, INR: 900 });
    assert.equal(s.paid, 4); assert.equal(s.toFulfil, 1); assert.equal(s.shipped, 1); assert.equal(s.delivered, 2); assert.equal(s.toRate, 1);
});

test('roadmap points at the first unfinished step', () => {
    const none = { draft: 0, pending_review: 0, published: 0, rejected: 0, archived: 0 };
    const sales0 = { paid: 0, delivered: 0 };
    assert.equal(svc.buildRoadmap({ application: null, activeCategories: 0, listings: none, sales: sales0 }).next.key, 'apply');
    assert.equal(svc.buildRoadmap({ application: { status: 'pending' }, activeCategories: 0, listings: none, sales: sales0 }).next.key, 'approved');
    assert.equal(svc.buildRoadmap({ application: { status: 'approved' }, activeCategories: 0, listings: none, sales: sales0 }).next.key, 'unlock');
    assert.equal(svc.buildRoadmap({ application: { status: 'approved' }, activeCategories: 1, listings: { ...none, draft: 1 }, sales: sales0 }).next.key, 'live');
    const done = svc.buildRoadmap({ application: { status: 'approved' }, activeCategories: 1, listings: { ...none, published: 1 }, sales: { paid: 2, delivered: 1 } });
    assert.equal(done.next, null); assert.equal(done.completed, done.total);
});
