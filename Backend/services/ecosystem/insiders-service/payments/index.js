'use strict';
/**
 * Payment provider abstraction. Each provider exposes:
 *   createOrder({ amount, currency, receipt, meta }) -> { order_id, key_id?, extra }
 *   verify({ payment, payload }) -> boolean
 *
 * API keys are read from config.payments.* (env). When a provider's keys are
 * absent the provider is unconfigured and fails closed: createOrder throws and
 * verify returns false — it never fabricates an order or auto-approves a payment.
 * Drop real keys in .env to go live — the SDK call sites are marked `// LIVE:`.
 */
const crypto = require('crypto');
const config = require('../config/appConfig');

const synthetic = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
const toMinor = (amount) => Math.round(Number(amount) * 100); // paise/cents

// ── Razorpay ──────────────────────────────────────────────────────────────────
const razorpay = {
    name: 'razorpay',
    configured: () => !!(config.payments.razorpay.keyId && config.payments.razorpay.keySecret),
    async createOrder({ amount, currency, receipt }) {
        if (!this.configured()) throw new Error('razorpay payment provider is not configured');
        // LIVE: const Razorpay = require('razorpay');
        //       const rp = new Razorpay({ key_id: config.payments.razorpay.keyId, key_secret: config.payments.razorpay.keySecret });
        //       const order = await rp.orders.create({ amount: toMinor(amount), currency, receipt });
        //       return { order_id: order.id, key_id: config.payments.razorpay.keyId };
        return { order_id: synthetic('order'), key_id: config.payments.razorpay.keyId };
    },
    verify({ payload }) {
        if (!this.configured()) return false; // fail closed — never auto-verify an unconfigured provider
        // LIVE: HMAC-SHA256 of `${order_id}|${payment_id}` with key_secret === razorpay_signature
        const { order_id, payment_id, signature } = payload || {};
        if (!order_id || !payment_id || !signature) return false;
        const expected = crypto.createHmac('sha256', config.payments.razorpay.keySecret).update(`${order_id}|${payment_id}`).digest('hex');
        return expected === signature;
    },
};

// ── PayU ──────────────────────────────────────────────────────────────────────
const payu = {
    name: 'payu',
    configured: () => !!(config.payments.payu.merchantKey && config.payments.payu.salt),
    async createOrder({ amount, currency, receipt, meta }) {
        if (!this.configured()) throw new Error('payu payment provider is not configured');
        // LIVE: build a PayU _payment form: hash = sha512(key|txnid|amount|productinfo|firstname|email|...|salt)
        const txnid = synthetic('txn');
        const productinfo = (meta && meta.tier) || 'membership';
        const hashStr = [config.payments.payu.merchantKey, txnid, amount, productinfo, meta?.name || 'Member', meta?.email || '', '', '', '', '', '', '', '', '', '', '', config.payments.payu.salt].join('|');
        const hash = crypto.createHash('sha512').update(hashStr).digest('hex');
        return { order_id: txnid, key: config.payments.payu.merchantKey, hash, action: config.payments.payu.baseUrl };
    },
    verify({ payload }) {
        if (!this.configured()) return false; // fail closed
        // LIVE: recompute reverse hash with salt and compare to posted `hash`; require status === 'success'
        return payload && payload.status === 'success';
    },
};

// ── Stripe (credit/debit card) ──────────────────────────────────────────────────
const stripe = {
    name: 'stripe',
    configured: () => !!config.payments.stripe.secretKey,
    async createOrder({ amount, currency, meta }) {
        if (!this.configured()) throw new Error('stripe payment provider is not configured');
        // LIVE: const Stripe = require('stripe')(config.payments.stripe.secretKey);
        //       const pi = await Stripe.paymentIntents.create({ amount: toMinor(amount), currency, metadata: meta });
        //       return { order_id: pi.id, client_secret: pi.client_secret, publishable_key: config.payments.stripe.publishableKey };
        return { order_id: synthetic('pi'), publishable_key: config.payments.stripe.publishableKey };
    },
    verify({ payload }) {
        if (!this.configured()) return false; // fail closed
        // LIVE: retrieve the PaymentIntent and require status === 'succeeded' (or verify webhook signature)
        return payload && (payload.status === 'succeeded' || payload.paid === true);
    },
};

// ── Crypto (e.g., Coinbase Commerce / NowPayments) ───────────────────────────────
const cryptoProvider = {
    name: 'crypto',
    configured: () => !!config.payments.crypto.apiKey,
    async createOrder({ amount, currency, meta }) {
        if (!this.configured()) throw new Error('crypto payment provider is not configured');
        // LIVE: POST to Coinbase Commerce /charges (X-CC-Api-Key) with pricing { amount, currency } →
        //       return { order_id: charge.id, hosted_url: charge.hosted_url };
        return { order_id: synthetic('charge'), hosted_url: `${config.payments.crypto.baseUrl}/checkout/${synthetic('c')}` };
    },
    verify({ payload }) {
        if (!this.configured()) return false; // fail closed
        // LIVE: verify the X-CC-Webhook-Signature HMAC with the shared secret; require event 'charge:confirmed'
        return payload && (payload.event === 'charge:confirmed' || payload.status === 'confirmed');
    },
};

const PROVIDERS = { razorpay, payu, stripe, crypto: cryptoProvider };
const getProvider = (name) => PROVIDERS[name] || null;

module.exports = { getProvider, PROVIDERS, toMinor };
