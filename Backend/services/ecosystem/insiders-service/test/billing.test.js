'use strict';
/**
 * Billing tests.
 *
 * These cover the guards that replaced the old free-membership paths, so they are written as
 * "this must not be grantable" rather than "the happy path works". The three defects they pin
 * down are the ones that were live: a checkout that granted membership with no charge, a confirm
 * step that trusted a client-supplied status, and a price the client could name.
 *
 * models/ and config/appConfig are injected through require.cache because both reach for a full
 * runtime environment (appConfig calls requireEnv at module scope) that a unit test has no
 * business providing.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SVC = path.join(__dirname, '..');

// ── Fakes ─────────────────────────────────────────────────────────────────────
function makeDb() {
    const state = { memberships: [], payments: [], claims: [], notifications: [] };
    const row = (obj, store) => ({
        ...obj,
        async update(patch) { Object.assign(this, patch); return this; },
        async destroy() { const i = store.indexOf(this); if (i >= 0) store.splice(i, 1); },
    });
    return {
        state,
        Membership: {
            async findOne({ where }) { return state.memberships.find((m) => m.user_id === where.user_id) || null; },
            async findOrCreate({ where, defaults }) {
                const found = state.memberships.find((m) => m.user_id === where.user_id);
                if (found) return [found, false];
                const created = row({ ...defaults }, state.memberships);
                state.memberships.push(created);
                return [created, true];
            },
        },
        Payment: {
            async create(attrs) { const r = row({ id: `pay_${state.payments.length + 1}`, ...attrs }, state.payments); state.payments.push(r); return r; },
            async findByPk(id) { return state.payments.find((p) => p.id === id) || null; },
        },
        BillingWebhookEvent: {
            async findOrCreate({ where, defaults }) {
                const found = state.claims.find((c) => c.provider === where.provider && c.event_id === where.event_id);
                if (found) return [found, false];
                const created = row({ ...defaults }, state.claims);
                state.claims.push(created);
                return [created, true];
            },
        },
        Notification: { async create(n) { state.notifications.push(n); return { id: 'n1' }; } },
    };
}

function loadBilling({ db }) {
    // Fresh module graph per test so cached state never leaks between cases.
    for (const k of Object.keys(require.cache)) {
        if (k.startsWith(SVC) && !k.includes('node_modules')) delete require.cache[k];
    }
    const inject = (rel, exports) => {
        const full = require.resolve(path.join(SVC, rel));
        require.cache[full] = new Module(full, null);
        require.cache[full].filename = full;
        require.cache[full].loaded = true;
        require.cache[full].exports = exports;
    };
    inject('models/index.js', db);
    inject('config/appConfig.js', {
        tiers: { founder: 299, investor_partner: 499 },
        upgradeGraceDays: 5,
        payments: { serviceUrl: 'http://payments.test', siteSlug: 'baalvion-elite-circle' },
    });
    return require(path.join(SVC, 'service/billingService.js'));
}

// ── Pricing is server-authoritative ───────────────────────────────────────────

test('a tier outside the catalogue has no price rather than a free one', () => {
    const billing = loadBilling({ db: makeDb() });
    assert.equal(billing.quoteTier(null, 'not_a_tier'), null);
    assert.equal(billing.quoteTier(null, '__proto__'), null);
});

test('an upgrade inside the grace window bills only the difference', () => {
    const billing = loadBilling({ db: makeDb() });
    const q = billing.quoteTier({ status: 'active', plan: 'founder', started_at: new Date() }, 'investor_partner');
    assert.equal(q.amount, 200);
    assert.equal(q.proration, true);
});

test('an upgrade past the grace window bills the full price', () => {
    const billing = loadBilling({ db: makeDb() });
    const old = new Date(Date.now() - 30 * 864e5);
    const q = billing.quoteTier({ status: 'active', plan: 'founder', started_at: old }, 'investor_partner');
    assert.equal(q.amount, 499);
    assert.equal(q.proration, false);
});

test('checkout refuses a tier the caller invented', async () => {
    const billing = loadBilling({ db: makeDb() });
    await assert.rejects(
        () => billing.startCheckout({ userId: 'u1', tier: 'free_please' }),
        (e) => e.statusCode === 400,
    );
});

// ── The internal callback is the only way to be granted a membership ──────────

test('a wrong or absent internal secret is rejected', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'a-real-secret-value-that-is-long';
    const billing = loadBilling({ db: makeDb() });
    assert.equal(billing.secretMatches('a-real-secret-value-that-is-long'), true);
    assert.equal(billing.secretMatches('wrong'), false);
    assert.equal(billing.secretMatches(''), false);
    assert.equal(billing.secretMatches(undefined), false);
    // A shorter/longer candidate must compare false, not throw — timingSafeEqual rejects
    // mismatched lengths, so both sides are hashed to a fixed width first.
    assert.equal(billing.secretMatches('short'), false);
    assert.equal(billing.secretMatches('a-real-secret-value-that-is-long-plus-more'), false);
});

test('fulfilment refuses an event with no id', async () => {
    const billing = loadBilling({ db: makeDb() });
    await assert.rejects(
        () => billing.fulfill({ eventId: null, metadata: { userId: 'u1', tier: 'founder' } }),
        (e) => e.statusCode === 400,
    );
});

test('fulfilment refuses an unknown tier instead of granting something', async () => {
    const billing = loadBilling({ db: makeDb() });
    await assert.rejects(
        () => billing.fulfill({ eventId: 'evt1', metadata: { userId: 'u1', tier: 'platinum' }, amountMinor: 1, currency: 'USD' }),
        (e) => e.statusCode === 400,
    );
});

test('a captured amount below the quote does not buy a membership', async () => {
    const db = makeDb();
    const billing = loadBilling({ db });
    // Quoted 299.00 USD = 29900 minor.
    const payment = await db.Payment.create({
        user_id: 'u1', tier: 'investor_partner', currency: 'USD',
        status: 'created', meta: { amount_minor: '49900' },
    });
    await assert.rejects(
        () => billing.fulfill({
            eventId: 'evt-underpaid', provider: 'razorpay',
            metadata: { userId: 'u1', tier: 'investor_partner', paymentId: payment.id },
            amountMinor: 100, currency: 'USD',
        }),
        (e) => e.code === 'AMOUNT_MISMATCH',
    );
    assert.equal(db.state.memberships.length, 0, 'no membership may exist after an underpayment');
});

test('a payment belonging to another user cannot activate this one', async () => {
    const db = makeDb();
    const billing = loadBilling({ db });
    const payment = await db.Payment.create({
        user_id: 'someone-else', tier: 'founder', currency: 'USD',
        status: 'created', meta: { amount_minor: '29900' },
    });
    await assert.rejects(
        () => billing.fulfill({
            eventId: 'evt-cross-user', provider: 'razorpay',
            metadata: { userId: 'u1', tier: 'founder', paymentId: payment.id },
            amountMinor: 29900, currency: 'USD',
        }),
        (e) => e.statusCode === 400,
    );
    assert.equal(db.state.memberships.length, 0);
});

test('an exact capture activates the membership once, and a redelivery does not repeat it', async () => {
    const db = makeDb();
    const billing = loadBilling({ db });
    const payment = await db.Payment.create({
        user_id: 'u1', tier: 'founder', currency: 'USD',
        status: 'created', meta: { amount_minor: '29900' },
    });
    const args = {
        eventId: 'evt-ok', provider: 'razorpay',
        metadata: { userId: 'u1', tier: 'founder', paymentId: payment.id, email: 'a@b.test' },
        amountMinor: 29900, currency: 'USD', providerRef: 'pay_abc',
    };

    const first = await billing.fulfill(args);
    assert.equal(first.applied, true);
    assert.equal(first.duplicate, false);
    assert.equal(db.state.memberships.length, 1);
    assert.equal(db.state.memberships[0].plan, 'founder');
    assert.equal(db.state.memberships[0].status, 'active');
    assert.equal(payment.status, 'paid');

    // At-least-once delivery: the provider or the JVM may send this again.
    const second = await billing.fulfill(args);
    assert.equal(second.duplicate, true);
    assert.equal(db.state.memberships.length, 1, 'a redelivery must not create a second membership');
});

test('a mismatched capture keeps its claim so it is never reprocessed as valid', async () => {
    const db = makeDb();
    const billing = loadBilling({ db });
    const payment = await db.Payment.create({
        user_id: 'u1', tier: 'founder', currency: 'USD',
        status: 'created', meta: { amount_minor: '29900' },
    });
    const bad = {
        eventId: 'evt-bad', provider: 'razorpay',
        metadata: { userId: 'u1', tier: 'founder', paymentId: payment.id },
        amountMinor: 1, currency: 'USD',
    };
    await assert.rejects(() => billing.fulfill(bad), (e) => e.code === 'AMOUNT_MISMATCH');
    // The claim survives: replaying the same bad event must not fall through to a fresh attempt.
    assert.equal(db.state.claims.length, 1);
    assert.equal(db.state.claims[0].status, 'claimed');
});

test('the retired local adapters throw instead of minting a synthetic order', () => {
    const adapters = require(path.join(SVC, 'payments/index.js'));
    assert.throws(() => adapters.getProvider('razorpay'), /retired/i);
    assert.throws(() => adapters.PROVIDERS, /retired/i);
});
