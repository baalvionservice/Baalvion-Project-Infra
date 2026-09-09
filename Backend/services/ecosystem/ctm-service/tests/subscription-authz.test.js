'use strict';
/**
 * Subscription entitlement authorisation.
 *
 * Both handlers already proved the caller OWNED the subscription. Neither proved the caller had
 * PAID for the plan they were naming, so a company member on the free tier could:
 *
 *   POST  /v1/subscriptions            { plan_id: <Business> }              → active, unpaid
 *   PATCH /v1/subscriptions/:id        { plan_id: <Business>, status: ... } → upgraded, unpaid
 *
 * Ownership is identity, not entitlement. These tests keep the two apart.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SVC = path.join(__dirname, '..');

const PLANS = {
    free: { id: 'plan-free', name: 'Free', monthly_price: '0.00', annual_price: '0.00' },
    biz: { id: 'plan-biz', name: 'Business', monthly_price: '499.00', annual_price: '4990.00' },
};

function loadController({ subscriptions = [] } = {}) {
    for (const k of Object.keys(require.cache)) {
        if (k.startsWith(SVC) && !k.includes('node_modules')) delete require.cache[k];
    }
    const rows = subscriptions.map((s) => ({ ...s, async save() { return this; } }));
    const db = {
        plans: {
            async findByPk(id) { return Object.values(PLANS).find((p) => p.id === id) || null; },
            // Business first on purpose: a positional fallback would pick the PAID plan.
            async findAll() { return [PLANS.biz, PLANS.free]; },
        },
        subscriptions: {
            async findByPk(id) { return rows.find((r) => r.id === id) || null; },
            async findOne({ where }) {
                return rows.find((r) => r.company_id === where.company_id && r.status === where.status) || null;
            },
            async create(attrs) { const r = { ...attrs, async save() { return this; } }; rows.push(r); return r; },
        },
    };
    const full = require.resolve(path.join(SVC, 'models/index.js'));
    require.cache[full] = new Module(full, null);
    require.cache[full].filename = full;
    require.cache[full].loaded = true;
    require.cache[full].exports = db;

    return { ctrl: require(path.join(SVC, 'controller/ctmController.js')), db, rows };
}

// Minimal express doubles: capture whatever the handler produced.
function run(handler, req) {
    return new Promise((resolve) => {
        const res = { status() { return this; }, json(body) { resolve({ ok: true, body }); } };
        handler(req, res, (err) => resolve({ ok: false, err }));
    });
}

const member = (orgId) => ({ auth: { roles: ['user'], orgId, userId: 'u1' } });
const admin = (orgId) => ({ auth: { roles: ['admin'], orgId, userId: 'a1' } });

test('a company member cannot create an active subscription on a paid plan', async () => {
    const { ctrl, rows } = loadController();
    const { ok, err } = await run(ctrl.createSubscription, { ...member('co1'), body: { plan_id: PLANS.biz.id } });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 402, 'a paid plan must go through checkout');
    assert.equal(rows.length, 0, 'nothing may be created');
});

test('a company member may still start on the free plan', async () => {
    const { ctrl, rows } = loadController();
    const { ok } = await run(ctrl.createSubscription, { ...member('co1'), body: { plan_id: PLANS.free.id } });
    assert.equal(ok, true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].plan_id, PLANS.free.id);
});

test('an unknown plan id is rejected rather than created', async () => {
    const { ctrl } = loadController();
    const { ok, err } = await run(ctrl.createSubscription, { ...member('co1'), body: { plan_id: 'plan-does-not-exist' } });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 400);
});

test('a second active subscription cannot be stacked on the same company', async () => {
    const { ctrl } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.free.id, status: 'active' }],
    });
    const { ok, err } = await run(ctrl.createSubscription, { ...member('co1'), body: { plan_id: PLANS.free.id } });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 409);
});

test('a company member cannot upgrade their own plan by PATCH', async () => {
    const { ctrl } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.free.id, status: 'active' }],
    });
    const { ok, err } = await run(ctrl.updateSubscription, {
        ...member('co1'), params: { id: 's1' }, body: { plan_id: PLANS.biz.id },
    });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 403);
});

test('a company member cannot set their subscription ACTIVE', async () => {
    const { ctrl } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.biz.id, status: 'past_due' }],
    });
    const { ok, err } = await run(ctrl.updateSubscription, {
        ...member('co1'), params: { id: 's1' }, body: { status: 'ACTIVE' },
    });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 403);
});

test('a company member cannot re-point the gateway reference at another subscription', async () => {
    const { ctrl } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.free.id, status: 'active' }],
    });
    const { ok, err } = await run(ctrl.updateSubscription, {
        ...member('co1'), params: { id: 's1' }, body: { gateway_subscription_id: 'sub_someone_else' },
    });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 403);
});

test('a company member may cancel their own subscription', async () => {
    const { ctrl, rows } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.biz.id, status: 'active' }],
    });
    const { ok } = await run(ctrl.updateSubscription, {
        ...member('co1'), params: { id: 's1' }, body: { status: 'cancelled' },
    });
    assert.equal(ok, true);
    assert.equal(rows[0].status, 'cancelled');
});

test('another company cannot touch this subscription at all', async () => {
    const { ctrl } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.free.id, status: 'active' }],
    });
    const { ok, err } = await run(ctrl.updateSubscription, {
        ...member('co2'), params: { id: 's1' }, body: { status: 'cancelled' },
    });
    assert.equal(ok, false);
    assert.equal(err.statusCode, 403);
});

test('an admin may still move a plan — billing operations are unaffected', async () => {
    const { ctrl, rows } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.free.id, status: 'active' }],
    });
    const { ok } = await run(ctrl.updateSubscription, {
        ...admin('co1'), params: { id: 's1' }, body: { plan_id: PLANS.biz.id, status: 'active' },
    });
    assert.equal(ok, true);
    assert.equal(rows[0].plan_id, PLANS.biz.id);
});

// ── Entitlement convergence (POST /subscriptions/ensure) ──────────────────────

test('ensure downgrades an elapsed period instead of leaving it active', async () => {
    const past = new Date(Date.now() - 864e5).toISOString();
    const { ctrl, rows } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.biz.id, status: 'active', current_period_end: past }],
    });
    const { ok, body } = await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    assert.equal(ok, true);
    assert.equal(rows[0].status, 'expired', 'the elapsed paid subscription must not stay active');
    assert.equal(body.data.plan.id, PLANS.free.id, 'and the company falls back to the free plan');
});

test('ensure leaves a subscription inside its period alone', async () => {
    const future = new Date(Date.now() + 30 * 864e5).toISOString();
    const { ctrl, rows } = loadController({
        subscriptions: [{ id: 's1', company_id: 'co1', plan_id: PLANS.biz.id, status: 'active', current_period_end: future }],
    });
    const { ok, body } = await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    assert.equal(ok, true);
    assert.equal(rows.length, 1, 'no replacement row is created');
    assert.equal(body.data.plan.id, PLANS.biz.id);
});

test('ensure is idempotent — repeated calls converge rather than accumulate', async () => {
    const { ctrl, rows } = loadController();
    await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    assert.equal(rows.length, 1, 'called on every page load, it must not stack rows');
});

test('ensure identifies the free plan by PRICE, never by name or list position', async () => {
    // The browser version fell back to plans[0] when nothing was called "Free". Here the only
    // zero-priced plan is second in the catalogue, so a positional fallback would grant Business.
    const { ctrl, rows } = loadController();
    const { ok } = await run(ctrl.ensureSubscription, { ...member('co1'), body: {} });
    assert.equal(ok, true);
    assert.equal(rows[0].plan_id, PLANS.free.id);
});
