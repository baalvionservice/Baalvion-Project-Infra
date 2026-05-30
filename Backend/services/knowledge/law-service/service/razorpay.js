'use strict';
// Razorpay gateway — REAL when RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set (test or live),
// otherwise the payment flow falls back to simulated settlement so it's fully testable now.
// Razorpay Checkout natively supports cards, UPI, netbanking, wallets and bank transfers.
// Implemented with fetch + HMAC (no SDK dependency).
const crypto = require('crypto');

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const API = process.env.RAZORPAY_API || 'https://api.razorpay.com/v1';

const isConfigured = () => !!(KEY_ID && KEY_SECRET);
const keyId = () => KEY_ID;

async function createOrder({ amount, currency, receipt, notes }) {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
        body: JSON.stringify({
            amount: Math.round(Number(amount) * 100), // smallest currency unit (paise)
            currency: String(currency || 'INR').toUpperCase(),
            receipt: receipt ? String(receipt) : undefined,
            notes: notes || {},
            payment_capture: 1,
        }),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Razorpay order failed: ${res.status} ${t.slice(0, 200)}`);
    }
    return res.json();
}

const safeEqual = (a, b) => {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// Checkout callback signature: HMAC_SHA256("order_id|payment_id", key_secret).
function verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!KEY_SECRET || !signature) return false;
    const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(rawBody, webhook_secret) === X-Razorpay-Signature.
function verifyWebhookSignature(rawBody, signature) {
    if (!WEBHOOK_SECRET) return false;
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
}

module.exports = { isConfigured, keyId, createOrder, verifyPaymentSignature, verifyWebhookSignature };
