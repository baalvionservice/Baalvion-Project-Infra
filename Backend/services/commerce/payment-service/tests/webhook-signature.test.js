'use strict';
// Webhook signature-verification regression tests for the gateway provider adapters.
// Pure unit tests (no DB/SDK). Each provider must ACCEPT a valid signature and REJECT a forged
// signature, a tampered body/amount, a missing signature, a missing secret, and (Stripe) a stale
// timestamp outside the replay window.
const { test } = require('node:test');
const assert = require('node:assert');
const razorpay = require('../gateway/adapters/razorpay');
const stripe = require('../gateway/adapters/stripe');
const payu = require('../gateway/adapters/payu');

const RZ = { webhookSecret: 'rz_secret' };
const ST = { webhookSecret: 'st_secret' };
const PU = { merchantKey: 'mk', merchantSalt: 'ms' };

test('razorpay HMAC-SHA256: valid accepted; forged/tampered/missing rejected', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', amount: 100, currency: 'INR' } } } });
    const sig = razorpay.signWebhook({ rawBody, secrets: RZ });
    assert.equal(razorpay.verifyWebhook({ rawBody, headers: { 'x-razorpay-signature': sig }, secrets: RZ }), true);
    assert.equal(razorpay.verifyWebhook({ rawBody, headers: { 'x-razorpay-signature': 'deadbeef' }, secrets: RZ }), false);   // forged
    assert.equal(razorpay.verifyWebhook({ rawBody: rawBody + ' ', headers: { 'x-razorpay-signature': sig }, secrets: RZ }), false); // tampered body
    assert.equal(razorpay.verifyWebhook({ rawBody, headers: {}, secrets: RZ }), false);                                          // missing signature
    assert.equal(razorpay.verifyWebhook({ rawBody, headers: { 'x-razorpay-signature': sig }, secrets: {} }), false);            // missing secret → fail-closed
});

test('razorpay replay window: fresh created_at accepted; stale (replayed) rejected', () => {
    const now = Math.floor(Date.now() / 1000);
    const mk = (createdAt) => JSON.stringify({ event: 'payment.captured', created_at: createdAt, payload: { payment: { entity: { id: 'pay_2', amount: 100 } } } });
    const fresh = mk(now);
    const stale = mk(now - 5000); // > 600s window
    assert.equal(razorpay.verifyWebhook({ rawBody: fresh, headers: { 'x-razorpay-signature': razorpay.signWebhook({ rawBody: fresh, secrets: RZ }) }, secrets: RZ }), true);
    assert.equal(razorpay.verifyWebhook({ rawBody: stale, headers: { 'x-razorpay-signature': razorpay.signWebhook({ rawBody: stale, secrets: RZ }) }, secrets: RZ }), false); // replay blocked
    // a body without created_at still verifies on signature alone (dedup remains the backstop)
    const noTs = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_3', amount: 100 } } } });
    assert.equal(razorpay.verifyWebhook({ rawBody: noTs, headers: { 'x-razorpay-signature': razorpay.signWebhook({ rawBody: noTs, secrets: RZ }) }, secrets: RZ }), true);
});

test('stripe signature scheme: valid accepted; wrong secret + stale timestamp (replay) rejected', () => {
    const rawBody = JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded', data: { object: { id: 'pi_1', amount: 100, currency: 'usd' } } });
    const header = stripe.signWebhook({ rawBody, secrets: ST });
    assert.equal(stripe.verifyWebhook({ rawBody, headers: { 'stripe-signature': header }, secrets: ST }), true);
    assert.equal(stripe.verifyWebhook({ rawBody, headers: { 'stripe-signature': header }, secrets: { webhookSecret: 'wrong' } }), false);
    const stale = stripe.signWebhook({ rawBody, secrets: ST, timestamp: Math.floor(Date.now() / 1000) - 4000 }); // > 300s window
    assert.equal(stripe.verifyWebhook({ rawBody, headers: { 'stripe-signature': stale }, secrets: ST }), false);  // replay blocked
    assert.equal(stripe.verifyWebhook({ rawBody, headers: {}, secrets: ST }), false);
});

test('payu SHA-512 field hash: valid accepted; tampered amount + forged hash rejected', () => {
    const body = { status: 'success', email: 'a@b.com', firstname: 'A', productinfo: 'x', amount: '10.00', txnid: 't1' };
    body.hash = payu.signWebhook({ body, secrets: PU });
    assert.equal(payu.verifyWebhook({ body, secrets: PU }), true);
    assert.equal(payu.verifyWebhook({ body: { ...body, amount: '999.00' }, secrets: PU }), false); // tampered amount
    assert.equal(payu.verifyWebhook({ body: { ...body, hash: 'deadbeef' }, secrets: PU }), false); // forged hash
    assert.equal(payu.verifyWebhook({ body: { ...body }, secrets: {} }), false);                   // missing secret → fail-closed
});
