'use strict';
// Razorpay checkout + webhook verification for Imperialpedia Premium subscriptions.
//
// Keys are resolved from the CENTRAL CMS vault first — the admin panel's "Integrations & Keys"
// for the `imperialpedia` website slug (category=payment, provider=razorpay). Paste/rotate a key
// in the console and checkout uses it immediately, NO redeploy and NO secret in this service's
// env. process.env (RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET) is only a fallback for local dev
// when the vault is unreachable. Mirrors the same pattern already proven in ctm-service and
// order-service — see Backend/services/ecosystem/ctm-service/service/payments.js.
const crypto = require('crypto');
const db = require('../models');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'imperialpedia';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;

const _cache = { at: 0, list: [] };

async function fetchVaultPayments() {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) return [];
    const now = Date.now();
    if (_cache.list.length && now - _cache.at < VAULT_TTL_MS) return _cache.list;
    try {
        const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/integrations/${encodeURIComponent(SITE_SLUG)}?category=payment`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET }, signal: controller.signal })
            .finally(() => clearTimeout(tid));
        if (!res.ok) return _cache.list;
        const body = await res.json().catch(() => ({}));
        const list = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
        _cache.at = now; _cache.list = list;
        return list;
    } catch {
        return _cache.list; // fail-open → last-known / env fallback
    }
}

// Resolve Razorpay checkout keys: vault first, then env. Returns { keyId, keySecret, webhookSecret,
// source } or null if unconfigured (checkout must fail closed, never fake a success).
async function resolveConfig() {
    const list = await fetchVaultPayments();
    const row = list.find((r) =>
        String(r.provider).toLowerCase() === 'razorpay' &&
        (r.category === 'payment' || r.category == null) &&
        r.enabled === true &&
        (r.status === 'configured' || r.status == null));
    if (row && row.secrets && row.secrets.keyId && row.secrets.keySecret) {
        const cfg = row.config || {};
        return { source: 'vault', keyId: row.secrets.keyId, keySecret: row.secrets.keySecret, webhookSecret: row.secrets.webhookSecret || cfg.webhookSecret || '' };
    }
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return { source: 'env', keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '' };
    }
    return null;
}

const isConfigured = async () => Boolean(await resolveConfig());

// Create a Razorpay order (amount in MAJOR units — converted to paise here). Returns the
// PUBLIC, no-secret clientParams the browser needs to open the Checkout modal.
async function createCheckout({ amount, currency = 'USD', planName, notes }) {
    const cfg = await resolveConfig();
    if (!cfg) throw new Error('Razorpay is not configured');
    const amountMinor = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error('amount must be a positive number');

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
    const order = await rzp.orders.create({ amount: amountMinor, currency, notes: notes || {} });

    return {
        ref: order.id,
        status: 'pending',
        clientParams: { provider: 'razorpay', keyId: cfg.keyId, orderId: order.id, amount: amountMinor, currency, name: planName || 'Imperialpedia Premium' },
        raw: order,
    };
}

// Verify a Razorpay webhook (HMAC-SHA256 over the raw body, constant-time compared). Throws on a
// bad/unverifiable signature — the caller must treat that as non-retryable (400), never activate.
async function verifyWebhook({ rawBody, headers }) {
    const signature = (headers || {})['x-razorpay-signature'];
    if (!signature) throw new Error('Missing Razorpay signature header');
    const cfg = await resolveConfig();
    if (!cfg || !cfg.webhookSecret) throw new Error('Razorpay webhook secret not configured');

    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid Razorpay signature');

    const evt = JSON.parse(rawBody.toString());
    const paid = evt.event === 'payment.captured' || evt.event === 'order.paid';
    const entity = evt.payload?.payment?.entity || evt.payload?.order?.entity || {};
    return {
        type: evt.event,
        ref: entity.order_id || entity.id,
        status: paid ? 'succeeded' : 'pending',
        amountMinor: entity.amount != null ? Number(entity.amount) : null,
        currency: (entity.currency || '').toUpperCase() || null,
        eventId: evt.id || entity.id,
        raw: evt,
    };
}

// Idempotent seed: the 3 plans the frontend already displays (mock-api/premium.ts), now backed
// by a real DB row so the server-authoritative checkout amount always matches what's shown.
const SEED_PLANS = [
    { tier_key: 'tier-free', name: 'Free', monthly_price: 0, annual_price: 0, currency: 'USD' },
    { tier_key: 'tier-pro', name: 'Pro', monthly_price: 29.99, annual_price: 299, currency: 'USD' },
    { tier_key: 'tier-enterprise', name: 'Enterprise', monthly_price: 99.99, annual_price: 999, currency: 'USD' },
];
async function seedPlans() {
    for (const p of SEED_PLANS) {
        await db.Plan.findOrCreate({ where: { tier_key: p.tier_key }, defaults: p });
    }
}

module.exports = { isConfigured, createCheckout, verifyWebhook, seedPlans, resolveConfig };
