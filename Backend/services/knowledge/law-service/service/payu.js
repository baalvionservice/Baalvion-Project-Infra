'use strict';
// PayU gateway — keys resolve from the CENTRAL CMS vault (same pattern as service/razorpay.js:
// admin panel "Integrations & Keys" for law-elite-network, category=payment, provider=payu).
// process.env fallback for local dev only. Faithful port of the hash algorithm proven in
// ctm-service/service/payments.js.
const crypto = require('crypto');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'law-elite-network';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;
const PAYU_UDF = '|||||||||||';
const PAYU_BASES = ['https://secure.payu.in', 'https://test.payu.in', 'https://secure.payu.com', 'https://sandbox.payu.in'];

const sha512Hex = (s) => crypto.createHash('sha512').update(String(s)).digest('hex');
function constantTimeEqual(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
function safeProviderBase(baseUrl, fallback) {
    const b = String(baseUrl || '').replace(/\/+$/, '');
    return PAYU_BASES.includes(b) ? b : fallback;
}
const payuRequestHash = ({ key, txnid, amount, productinfo, firstname, email, salt }) =>
    sha512Hex(`${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}${PAYU_UDF}${salt}`);
const payuResponseHash = ({ salt, status, email, firstname, productinfo, amount, txnid, key }) =>
    sha512Hex(`${salt}|${status}${PAYU_UDF}${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);

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
        String(r.provider).toLowerCase() === 'payu' &&
        (r.category === 'payment' || r.category == null) &&
        r.enabled === true &&
        (r.status === 'configured' || r.status == null)) || null;
}

async function resolveConfig() {
    const row = await vaultRow();
    if (row && row.secrets && row.secrets.merchantKey && row.secrets.merchantSalt) {
        const cfg = row.config || {};
        return { source: 'vault', merchantKey: row.secrets.merchantKey, merchantSalt: row.secrets.merchantSalt, baseUrl: cfg.baseUrl || '', mode: cfg.mode || 'live' };
    }
    if (process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT) {
        return { source: 'env', merchantKey: process.env.PAYU_MERCHANT_KEY, merchantSalt: process.env.PAYU_MERCHANT_SALT, baseUrl: process.env.PAYU_BASE_URL || '', mode: 'env' };
    }
    return null;
}

const isConfigured = async () => (await resolveConfig()) !== null;

// PayU has no server-to-server order-create API — sign the request hash and hand the browser a
// form-POST. Settlement is provider-authoritative via the return-hash verification below.
async function createOrder({ amount, currency, receipt, customerEmail, customerName }) {
    const cfg = await resolveConfig();
    if (!cfg) throw new Error('PayU is not configured (no vault key or PAYU_MERCHANT_KEY/SALT)');
    const base = safeProviderBase(cfg.baseUrl, cfg.mode === 'test' ? 'https://test.payu.in' : 'https://secure.payu.in');
    const amountStr = Number(amount).toFixed(2);
    const txnid = `law_${crypto.randomBytes(12).toString('hex')}`.slice(0, 25);
    const productinfo = receipt ? String(receipt).slice(0, 100) : 'Law Elite Network consultation';
    const firstname = (customerName || (customerEmail ? customerEmail.split('@')[0] : 'client')).slice(0, 60) || 'client';
    const email = customerEmail || 'billing@lawelitenetwork.com';
    const hash = payuRequestHash({ key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email, salt: cfg.merchantSalt });
    const ret = process.env.PAYU_RETURN_URL || 'https://lawelitenetwork.com/api/v1/payments/payu-webhook';
    return {
        txnid, action: `${base}/_payment`,
        fields: { key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email, phone: process.env.PAYU_DEFAULT_PHONE || '9999999999', surl: ret, furl: ret, hash, currency: String(currency || 'INR').toUpperCase() },
    };
}

// Verify a PayU form-POST return (no signature header — SHA-512 REVERSE hash over posted fields).
async function verifyReturn(body) {
    if (!body || !body.hash) return false;
    const cfg = await resolveConfig();
    if (!cfg) return false;
    const expected = payuResponseHash({
        salt: cfg.merchantSalt, status: body.status, email: body.email, firstname: body.firstname,
        productinfo: body.productinfo, amount: body.amount, txnid: body.txnid, key: cfg.merchantKey,
    });
    return constantTimeEqual(body.hash, expected);
}

module.exports = { isConfigured, resolveConfig, createOrder, verifyReturn };
