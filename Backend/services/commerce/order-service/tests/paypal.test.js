'use strict';
/**
 * PayPal adapter rules that must hold without a network: which currencies are chargeable, how
 * amounts are rendered, and that an unverifiable webhook is refused rather than trusted.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SVC = path.join(__dirname, '..');

function load(env = {}) {
    for (const k of Object.keys(require.cache)) {
        if (k.startsWith(SVC) && !k.includes('node_modules')) delete require.cache[k];
    }
    const full = require.resolve(path.join(SVC, 'service/cmsVault.js'));
    require.cache[full] = new Module(full, null);
    require.cache[full].filename = full;
    require.cache[full].loaded = true;
    require.cache[full].exports = { getPaymentCreds: async () => null };
    for (const k of ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID', 'PAYPAL_BASE_URL']) delete process.env[k];
    Object.assign(process.env, env);
    return { paypal: require(path.join(SVC, 'service/paypal.js')), money: require('@baalvion/money') };
}

test('renders amounts as PayPal decimal strings, whole units for JPY/HUF/TWD', () => {
    const { paypal, money } = load();
    assert.equal(paypal.toPayPalValue(money.Money.fromDatabaseValue('10.5', 'USD')), '10.50');
    assert.equal(paypal.toPayPalValue(money.Money.fromDatabaseValue('1500', 'JPY')), '1500');
    assert.equal(paypal.toPayPalValue(money.Money.fromDatabaseValue('2500', 'HUF')), '2500');
    assert.throws(() => paypal.toPayPalValue(money.Money.fromDatabaseValue('2500.50', 'HUF')), /whole units/);
});

test('refuses currencies PayPal cannot settle before any API call', () => {
    const { paypal } = load();
    assert.throws(() => paypal.assertSupportedCurrency('INR'), /cannot settle currency 'INR'/);
    assert.equal(paypal.assertSupportedCurrency('gbp'), 'GBP');
});

test('an unconfigured PayPal is not offered, and its webhook is refused', async () => {
    const { paypal } = load();
    await assert.rejects(paypal.paypalCreds(), /not configured/);
    assert.equal(await paypal.verifyWebhook({ headers: {}, event: {} }), false);
});

test('a configured PayPal without a webhook id still refuses webhooks', async () => {
    const { paypal } = load({ PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 'secret' });
    const headers = Object.fromEntries(['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'].map((h) => [h, 'x']));
    assert.equal(await paypal.verifyWebhook({ headers, event: {} }), false);
});
