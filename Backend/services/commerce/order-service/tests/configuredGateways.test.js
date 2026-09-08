'use strict';
/**
 * Which gateways the storefront is allowed to offer.
 *
 * The checkout previously rendered a fixed set of gateway cards and preselected Stripe, so on a
 * store with no Stripe account the default choice was one that could not charge — and the shopper
 * only learned that at the last step. These tests pin the rule that "offered" is derived from the
 * same credentials the charge itself resolves, so the two cannot drift.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SVC = path.join(__dirname, '..');

function load({ env = {}, vault = () => null } = {}) {
    for (const k of Object.keys(require.cache)) {
        if (k.startsWith(SVC) && !k.includes('node_modules')) delete require.cache[k];
    }
    const full = require.resolve(path.join(SVC, 'service/cmsVault.js'));
    require.cache[full] = new Module(full, null);
    require.cache[full].filename = full;
    require.cache[full].loaded = true;
    require.cache[full].exports = { getPaymentCreds: async (name) => vault(name) };

    const saved = {};
    for (const key of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'STRIPE_SECRET_KEY',
        'PAYU_MERCHANT_KEY', 'PAYU_MERCHANT_SALT', 'PAYMENT_PROVIDER',
        'CRYPTO_WALLET_BTC', 'CRYPTO_WALLET_ETH', 'CRYPTO_WALLET_USDT']) {
        saved[key] = process.env[key];
        delete process.env[key];
    }
    Object.assign(process.env, env);
    const mod = require(path.join(SVC, 'service/paymentProvider.js'));
    return { mod, restore: () => Object.assign(process.env, saved) };
}

test('a gateway with no credentials is never offered', async () => {
    const { mod, restore } = load();
    try {
        const { gateways } = await mod.configuredGateways();
        assert.ok(!gateways.includes('razorpay'));
        assert.ok(!gateways.includes('stripe'));
        assert.ok(!gateways.includes('payu'));
    } finally { restore(); }
});

test('bank transfer is always offered — it needs no credentials', async () => {
    const { mod, restore } = load();
    try {
        const { gateways, preferred } = await mod.configuredGateways();
        assert.deepEqual(gateways, ['bank']);
        assert.equal(preferred, 'bank');
    } finally { restore(); }
});

test('Stripe appears only when a Stripe secret key actually resolves', async () => {
    const withoutStripe = load({ env: { RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's' } });
    try {
        const { gateways, preferred } = await withoutStripe.mod.configuredGateways();
        assert.ok(gateways.includes('razorpay'));
        assert.ok(!gateways.includes('stripe'), 'no Stripe account on this estate');
        assert.equal(preferred, 'razorpay');
    } finally { withoutStripe.restore(); }

    const withStripe = load({ env: { STRIPE_SECRET_KEY: 'sk_test_x' } });
    try {
        const { gateways } = await withStripe.mod.configuredGateways();
        assert.ok(gateways.includes('stripe'));
    } finally { withStripe.restore(); }
});

test('credentials from the admin vault count the same as env vars', async () => {
    const { mod, restore } = load({
        vault: (name) => (name === 'payu'
            ? { secrets: { merchantKey: 'mk', merchantSalt: 'ms' }, config: {} }
            : null),
    });
    try {
        const { gateways, preferred } = await mod.configuredGateways();
        assert.ok(gateways.includes('payu'));
        assert.equal(preferred, 'payu');
    } finally { restore(); }
});

test('the service default is only preferred when it can actually charge', async () => {
    // PAYMENT_PROVIDER names Stripe, but no Stripe key resolves — preferring it would send every
    // shopper to a gateway that cannot take their money.
    const { mod, restore } = load({
        env: { PAYMENT_PROVIDER: 'stripe', RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's' },
    });
    try {
        const { gateways, preferred } = await mod.configuredGateways();
        assert.ok(!gateways.includes('stripe'));
        assert.equal(preferred, 'razorpay');
    } finally { restore(); }
});

test('crypto is offered only once a wallet address exists', async () => {
    const none = load();
    try {
        assert.ok(!(await none.mod.configuredGateways()).gateways.includes('crypto'));
    } finally { none.restore(); }

    const withWallet = load({ env: { CRYPTO_WALLET_BTC: 'bc1qexample' } });
    try {
        assert.ok((await withWallet.mod.configuredGateways()).gateways.includes('crypto'));
    } finally { withWallet.restore(); }
});

// ── Mock payments are never reachable by omission ─────────────────────────────

test('an unset PAYMENT_PROVIDER refuses to resolve a provider at all', () => {
    const { mod, restore } = load();
    try {
        // 'mock' used to be the final fallback here, so a service with nothing configured captured
        // orders through a provider that verifies no signature — real orders marked paid, no money.
        assert.throws(() => mod.getProvider(), /refusing to guess/i);
    } finally { restore(); }
});

test('naming mock is not enough — it must also be opted into', () => {
    const { mod, restore } = load();
    const savedAllow = process.env.ALLOW_MOCK_PAYMENTS;
    const savedEnv = process.env.NODE_ENV;
    try {
        delete process.env.ALLOW_MOCK_PAYMENTS;
        assert.throws(() => mod.getProvider('mock'), /ALLOW_MOCK_PAYMENTS/);

        process.env.ALLOW_MOCK_PAYMENTS = 'true';
        assert.doesNotThrow(() => mod.getProvider('mock'));

        // ...and never in production, opt-in or not.
        process.env.NODE_ENV = 'production';
        assert.throws(() => mod.getProvider('mock'), /forbidden in production/);
    } finally {
        if (savedAllow === undefined) delete process.env.ALLOW_MOCK_PAYMENTS;
        else process.env.ALLOW_MOCK_PAYMENTS = savedAllow;
        process.env.NODE_ENV = savedEnv;
        restore();
    }
});

test('an unknown provider name is rejected rather than silently mocked', () => {
    const { mod, restore } = load();
    try {
        assert.throws(() => mod.getProvider('not-a-gateway'), /unknown payment provider/i);
    } finally { restore(); }
});
