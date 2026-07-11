'use strict';
// Razorpay gateway — keys resolve from the CENTRAL CMS vault (the admin panel's
// "Integrations & Keys" for the law-elite-network website, category=payment,
// provider=razorpay). Paste a key in the console and checkout uses it within
// VAULT_TTL_MS, NO redeploy and NO secret in this service's env. process.env
// (RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET) is only a fallback for local dev
// when the vault is unreachable/unconfigured — mirrors the same vault-first,
// env-fallback pattern already used by ctm-service/service/payments.js.
// Implemented with fetch + HMAC (no SDK dependency).
const crypto = require('crypto');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'law-elite-network';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';           // e.g. http://cms-service:3011/api/v1
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;
const API = process.env.RAZORPAY_API || 'https://api.razorpay.com/v1';

const _cache = { bySlug: {} };

// Fetch + cache the website's payment integrations from the CMS vault. NEVER throws — returns the
// last-known list (or []) on any error so we degrade to the env fallback.
async function fetchVaultPayments(slug) {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) return [];
    const hit = _cache.bySlug[slug];
    const now = Date.now();
    if (hit && now - hit.at < VAULT_TTL_MS) return hit.list;
    try {
        const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/integrations/${encodeURIComponent(slug)}?category=payment`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET }, signal: controller.signal })
            .finally(() => clearTimeout(tid));
        if (!res.ok) return hit ? hit.list : [];
        const body = await res.json().catch(() => ({}));
        const list = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
        _cache.bySlug[slug] = { at: now, list };
        return list;
    } catch {
        return hit ? hit.list : [];
    }
}

async function vaultRow() {
    const list = await fetchVaultPayments(SITE_SLUG);
    return list.find((r) =>
        String(r.provider).toLowerCase() === 'razorpay' &&
        (r.category === 'payment' || r.category == null) &&
        r.enabled === true &&
        (r.status === 'configured' || r.status == null)) || null;
}

// Resolve { keyId, keySecret, webhookSecret, source } from the vault first, then env. Returns
// null when neither is configured.
async function resolveConfig() {
    const row = await vaultRow();
    if (row && row.secrets && row.secrets.keyId && row.secrets.keySecret) {
        const cfg = row.config || {};
        return {
            source: 'vault',
            keyId: row.secrets.keyId,
            keySecret: row.secrets.keySecret,
            webhookSecret: row.secrets.webhookSecret || cfg.webhookSecret || '',
        };
    }
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return {
            source: 'env',
            keyId: process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_KEY_SECRET,
            webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        };
    }
    return null;
}

const isConfigured = async () => (await resolveConfig()) !== null;
const keyId = async () => { const cfg = await resolveConfig(); return cfg ? cfg.keyId : ''; };

async function createOrder({ amount, currency, receipt, notes }) {
    const cfg = await resolveConfig();
    if (!cfg) throw new Error('Razorpay is not configured (no vault key or RAZORPAY_KEY_ID/SECRET)');
    const auth = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64');
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
// This is the SOLE gate for accepting a client-supplied signature — every
// input is validated here (type + presence) before the cryptographic
// comparison runs, so callers can invoke this unconditionally rather than
// pre-checking client fields themselves (a user-controlled boolean must
// never decide whether the crypto check even runs).
async function verifyPaymentSignature({ orderId, paymentId, signature }) {
    const cfg = await resolveConfig();
    if (!cfg || !cfg.keySecret) return false;
    if (typeof signature !== 'string' || !signature) return false;
    if (typeof paymentId !== 'string' || !paymentId) return false;
    if (typeof orderId !== 'string' || !orderId) return false;
    const expected = crypto.createHmac('sha256', cfg.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(rawBody, webhook_secret) === X-Razorpay-Signature.
async function verifyWebhookSignature(rawBody, signature) {
    const cfg = await resolveConfig();
    if (!cfg || !cfg.webhookSecret) return false;
    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
}

// Resolve just the webhook secret (used by the controller's fail-closed check, independent of
// whether checkout keys are also configured).
async function resolveWebhookSecret() {
    const cfg = await resolveConfig();
    return (cfg && cfg.webhookSecret) || '';
}

module.exports = { isConfigured, keyId, createOrder, verifyPaymentSignature, verifyWebhookSignature, resolveWebhookSecret, resolveConfig };
