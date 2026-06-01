'use strict';
/**
 * Stripe adapter.
 *
 * - createOrder: live → PaymentIntents API (Bearer secretKey, form-encoded);
 *   mock → deterministic intent id + client secret.
 * - verifyWebhook: REAL Stripe signature scheme — HMAC-SHA256(`${t}.${rawBody}`,
 *   webhookSecret) compared to the v1 signature in the `stripe-signature` header,
 *   with a timestamp tolerance window.
 * - parseWebhook: maps the Stripe event envelope to our canonical fields.
 * - signWebhook: produces a valid `t=..,v1=..` header value (E2E / clients).
 */
const { hmacSha256Hex, timingSafeEqual, nowSeconds } = require('./base');

const API = 'https://api.stripe.com/v1';
const TOLERANCE_SECONDS = 300;

function mapStatus(type) {
    if (type === 'payment_intent.succeeded' || type === 'charge.succeeded') return 'captured';
    if (type === 'payment_intent.amount_capturable_updated' || type === 'payment_intent.requires_action') return 'authorized';
    if (type === 'payment_intent.payment_failed' || type === 'charge.failed') return 'failed';
    if (type === 'charge.refunded' || type === 'refund.created') return 'refunded';
    return 'failed';
}

async function createOrder({ amount, currency, receipt, secrets, mode }) {
    if (mode !== 'live') {
        const id = 'pi_mock_' + hmacSha256Hex(`${receipt}:${amount}:${currency}`, secrets.secretKey || 'mock').slice(0, 14);
        return {
            providerOrderId: id,
            clientParams: { clientSecret: `${id}_secret_mock`, publishableKey: secrets.publishableKey || 'pk_test_mock', amount, currency },
            raw: { mocked: true },
        };
    }
    const form = new URLSearchParams({ amount: String(amount), currency: String(currency).toLowerCase(), 'automatic_payment_methods[enabled]': 'true' });
    if (receipt) form.set('metadata[receipt]', receipt);
    const res = await fetch(`${API}/payment_intents`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${secrets.secretKey}` },
        body: form.toString(),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) { const e = new Error(`stripe intent create failed (HTTP ${res.status})`); e.providerStatus = res.status; throw e; }
    return {
        providerOrderId: data.id,
        clientParams: { clientSecret: data.client_secret, publishableKey: secrets.publishableKey, amount: data.amount, currency: data.currency },
        raw: data,
    };
}

function parseSigHeader(header) {
    const out = { t: null, v1: [] };
    String(header || '').split(',').forEach((part) => {
        const [k, v] = part.split('=');
        if (k === 't') out.t = v;
        else if (k === 'v1') out.v1.push(v);
    });
    return out;
}

function verifyWebhook({ rawBody, headers, secrets }) {
    const header = headers['stripe-signature'];
    if (!header || !secrets || !secrets.webhookSecret) return false;
    const { t, v1 } = parseSigHeader(header);
    if (!t || v1.length === 0) return false;
    if (Math.abs(nowSeconds() - Number(t)) > TOLERANCE_SECONDS) return false;
    const body = typeof rawBody === 'string' ? rawBody : (rawBody ? rawBody.toString('utf8') : '');
    const expected = hmacSha256Hex(`${t}.${body}`, secrets.webhookSecret);
    return v1.some((sig) => timingSafeEqual(sig, expected));
}

function parseWebhook({ body }) {
    const type = body.type || '';
    const obj = (body.data && body.data.object) || {};
    const status = mapStatus(type);
    // For charge events obj.id is a charge id (ch_…); the canonical order id we
    // stored at createOrder time is the PaymentIntent (pi_…) — use obj.payment_intent.
    const orderId = (obj.object === 'charge' ? obj.payment_intent : obj.id) || obj.id || null;
    return {
        providerEventId: body.id || null,
        eventType: `payment.${status}`,
        providerOrderId: orderId,
        providerPaymentId: obj.id || null,
        amount: obj.amount != null ? Number(obj.amount) : (obj.amount_received != null ? Number(obj.amount_received) : null),
        currency: obj.currency ? String(obj.currency).toUpperCase() : null,
        status,
        raw: body,
    };
}

/** Test/helper: a valid `stripe-signature` header value for a raw body. */
function signWebhook({ rawBody, secrets, timestamp }) {
    const t = timestamp || nowSeconds();
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return `t=${t},v1=${hmacSha256Hex(`${t}.${body}`, secrets.webhookSecret)}`;
}

module.exports = { name: 'stripe', createOrder, verifyWebhook, parseWebhook, signWebhook };
