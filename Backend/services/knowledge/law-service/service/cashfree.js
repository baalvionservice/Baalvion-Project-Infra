'use strict';
// Cashfree gateway — keys resolve from the CENTRAL CMS vault (same pattern as
// service/razorpay.js: admin panel "Integrations & Keys" for law-elite-network,
// category=payment, provider=cashfree). process.env fallback for local dev only.
const crypto = require('crypto');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'law-elite-network';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;
const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_BASES = ['https://api.cashfree.com', 'https://sandbox.cashfree.com'];

function constantTimeEqual(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
function safeProviderBase(baseUrl, fallback) {
    const b = String(baseUrl || '').replace(/\/+$/, '');
    return CASHFREE_BASES.includes(b) ? b : fallback;
}

const _cache = { bySlug: {} };
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
        String(r.provider).toLowerCase() === 'cashfree' &&
        (r.category === 'payment' || r.category == null) &&
        r.enabled === true &&
        (r.status === 'configured' || r.status == null)) || null;
}

async function resolveConfig() {
    const row = await vaultRow();
    if (row && row.secrets && row.secrets.clientId && row.secrets.clientSecret) {
        const cfg = row.config || {};
        return { source: 'vault', clientId: row.secrets.clientId, clientSecret: row.secrets.clientSecret, baseUrl: cfg.baseUrl || '', mode: cfg.mode || 'live' };
    }
    if (process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
        return { source: 'env', clientId: process.env.CASHFREE_CLIENT_ID, clientSecret: process.env.CASHFREE_CLIENT_SECRET, baseUrl: process.env.CASHFREE_BASE_URL || '', mode: 'env' };
    }
    return null;
}

const isConfigured = async () => (await resolveConfig()) !== null;

async function createOrder({ amount, currency, receipt, customerEmail }) {
    const cfg = await resolveConfig();
    if (!cfg) throw new Error('Cashfree is not configured (no vault key or CASHFREE_CLIENT_ID/SECRET)');
    const base = safeProviderBase(cfg.baseUrl, cfg.mode === 'test' ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com');
    const cfOrderId = `law_${crypto.randomBytes(12).toString('hex')}`;
    const notifyUrl = process.env.CASHFREE_NOTIFY_URL || 'https://lawelitenetwork.com/api/v1/payments/cashfree-webhook';
    const res = await fetch(`${base}/pg/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-client-id': cfg.clientId, 'x-client-secret': cfg.clientSecret, 'x-api-version': CASHFREE_API_VERSION },
        body: JSON.stringify({
            order_id: cfOrderId,
            order_amount: Number(amount).toFixed(2),
            order_currency: String(currency || 'INR').toUpperCase(),
            customer_details: {
                customer_id: `cust_${crypto.createHash('sha256').update(String(receipt || cfOrderId)).digest('hex').slice(0, 24)}`,
                customer_email: customerEmail || 'billing@lawelitenetwork.com',
                customer_phone: process.env.CASHFREE_DEFAULT_PHONE || '9999999999',
            },
            order_meta: { notify_url: notifyUrl },
            order_tags: { receipt: String(receipt || '') },
        }),
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
    if (!res.ok) {
        console.warn(JSON.stringify({ evt: 'cashfree_order_error', status: res.status, code: data && (data.code || data.type) }));
        throw new Error(`Cashfree order failed (${res.status})`);
    }
    const mode = base.includes('sandbox') ? 'sandbox' : 'production';
    return { orderId: data.order_id || cfOrderId, paymentSessionId: data.payment_session_id, mode };
}

// Cashfree webhook: signature = base64(HMAC-SHA256(timestamp + rawBody, clientSecret)).
async function verifyWebhookSignature(rawBody, signature, timestamp) {
    const cfg = await resolveConfig();
    if (!cfg || !cfg.clientSecret) return false;
    const tsSeconds = Number.parseInt(String(timestamp), 10);
    if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) return false;
    const expected = crypto.createHmac('sha256', cfg.clientSecret).update(String(timestamp) + rawBody.toString('utf8')).digest('base64');
    return constantTimeEqual(String(signature), expected);
}

module.exports = { isConfigured, resolveConfig, createOrder, verifyWebhookSignature };
