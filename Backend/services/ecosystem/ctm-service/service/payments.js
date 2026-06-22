'use strict';
// Provider-agnostic payments. Keys are resolved from the CENTRAL CMS vault — the admin panel's
// "Integrations & Keys" for the CTM website slug (control-the-market). Paste a Stripe/Razorpay/PayU/
// Cashfree key in the console and checkout uses it immediately, NO redeploy and NO secret in this
// service's env. process.env is only a fallback for local dev when the vault is unreachable. SDKs
// load lazily so the service boots with nothing configured (it then runs in 'manual' mode — dev/demo).
//
//   Vault (per website slug, category=payment):  stripe   → { secretKey, webhookSecret }
//                                                razorpay → { keyId, keySecret, webhookSecret }
//                                                payu     → { merchantKey, merchantSalt } + config.mode/baseUrl
//                                                cashfree → { clientId, clientSecret } + config.mode/baseUrl
//   Env fallback (dev only): STRIPE_*, RAZORPAY_*, PAYU_MERCHANT_KEY/SALT, CASHFREE_CLIENT_ID/SECRET
const crypto = require('crypto');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'control-the-market';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';            // e.g. http://cms-service:3011/api/v1
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;
const CASHFREE_API_VERSION = '2023-08-01';

// Which providers checkout can offer (vault- or env-configured). Order = preference for the default.
const PROVIDERS = ['stripe', 'razorpay', 'payu', 'cashfree'];

// PayU is a redirect/form-POST flow with SHA-512 hash auth — faithful port of the platform's proven
// adapter (Java PayUGateway / proxy payu.js). The 11-pipe block is PayU's empty-udf field sequence.
const PAYU_UDF = '|||||||||||';
const sha512Hex = (s) => crypto.createHash('sha512').update(String(s)).digest('hex');
// Constant-time string compare for fixed-length digests (PayU SHA-512 hex OR Cashfree base64 HMAC).
// Length mismatch is itself a tamper signal → reject before the timing-safe byte compare.
function constantTimeEqual(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// SSRF guard: the provider baseUrl can come from the CMS vault (an admin-pasted value). Only ever
// talk to / form-POST to an OFFICIAL provider endpoint — a hostile/mistyped value falls back to the
// default rather than letting the server send credentials to an attacker host.
const PAYU_BASES = ['https://secure.payu.in', 'https://test.payu.in', 'https://secure.payu.com', 'https://sandbox.payu.in'];
const CASHFREE_BASES = ['https://api.cashfree.com', 'https://sandbox.cashfree.com'];
function safeProviderBase(baseUrl, allowed, fallback) {
    const b = String(baseUrl || '').replace(/\/+$/, '');
    if (!b) return fallback;
    return allowed.includes(b) ? b : fallback;
}
// request hash:  sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
const payuRequestHash = ({ key, txnid, amount, productinfo, firstname, email, salt }) =>
    sha512Hex(`${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}${PAYU_UDF}${salt}`);
// reverse hash:  sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
const payuResponseHash = ({ salt, status, email, firstname, productinfo, amount, txnid, key }) =>
    sha512Hex(`${salt}|${status}${PAYU_UDF}${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);

const _cache = { bySlug: {} };

// Fetch + cache the website's payment integrations from the CMS vault. NEVER throws — returns the
// last-known list (or []) on any error so we degrade to the env fallback. 60s cache mirrors the
// Java PspConfigResolver so a key pasted in the console is live within a minute.
async function fetchVaultPayments(slug) {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) return [];
    const hit = _cache.bySlug[slug];
    const now = Date.now();
    if (hit && now - hit.at < VAULT_TTL_MS) return hit.list;
    try {
        const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/integrations/${encodeURIComponent(slug)}?category=payment`;
        // Bounded timeout so a slow/unresponsive CMS can't hang every checkout (DoS guard); on
        // timeout we fall through to the last-known list / env fallback.
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

// Find the enabled+configured vault row for a provider (category=payment).
async function vaultRow(provider) {
    const list = await fetchVaultPayments(SITE_SLUG);
    return list.find((r) =>
        String(r.provider).toLowerCase() === provider &&
        (r.category === 'payment' || r.category == null) &&
        r.enabled === true &&
        (r.status === 'configured' || r.status == null)) || null;
}

// Resolve the CHECKOUT config (order keys) for a provider: vault first, then env. Returns
// { source, secretKey?|keyId?+keySecret?, webhookSecret, mode } or null if not configured.
async function resolveConfig(provider) {
    const row = await vaultRow(provider);
    if (row && row.secrets) {
        const s = row.secrets; const cfg = row.config || {};
        const webhookSecret = s.webhookSecret || cfg.webhookSecret || '';
        const mode = cfg.mode || 'live';
        const baseUrl = cfg.baseUrl || '';
        if (provider === 'stripe' && s.secretKey) return { source: 'vault', secretKey: s.secretKey, webhookSecret, mode };
        if (provider === 'razorpay' && s.keyId && s.keySecret) return { source: 'vault', keyId: s.keyId, keySecret: s.keySecret, webhookSecret, mode };
        if (provider === 'payu' && s.merchantKey && s.merchantSalt) return { source: 'vault', merchantKey: s.merchantKey, merchantSalt: s.merchantSalt, baseUrl, webhookSecret, mode };
        if (provider === 'cashfree' && s.clientId && s.clientSecret) return { source: 'vault', clientId: s.clientId, clientSecret: s.clientSecret, baseUrl, webhookSecret, mode };
    }
    if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) return { source: 'env', secretKey: process.env.STRIPE_SECRET_KEY, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '', mode: 'env' };
    if (provider === 'razorpay' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return { source: 'env', keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '', mode: 'env' };
    if (provider === 'payu' && process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT) return { source: 'env', merchantKey: process.env.PAYU_MERCHANT_KEY, merchantSalt: process.env.PAYU_MERCHANT_SALT, baseUrl: process.env.PAYU_BASE_URL || '', webhookSecret: '', mode: 'env' };
    if (provider === 'cashfree' && process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) return { source: 'env', clientId: process.env.CASHFREE_CLIENT_ID, clientSecret: process.env.CASHFREE_CLIENT_SECRET, baseUrl: process.env.CASHFREE_BASE_URL || '', webhookSecret: '', mode: 'env' };
    return null;
}

// Resolve the WEBHOOK secret for a provider (vault first, then env) — independent of order keys so
// signature verification works even when only the webhook secret is present.
async function resolveWebhookSecret(provider) {
    // PayU's return is verified with the merchantSalt; Cashfree's webhook with the clientSecret —
    // neither has a separate "webhook secret", so resolve the auth material the verifier actually uses.
    if (provider === 'payu') { const cfg = await resolveConfig('payu'); return (cfg && cfg.merchantSalt) || ''; }
    if (provider === 'cashfree') { const cfg = await resolveConfig('cashfree'); return (cfg && cfg.clientSecret) || ''; }
    const row = await vaultRow(provider);
    if (row && row.secrets) {
        const ws = row.secrets.webhookSecret || (row.config || {}).webhookSecret;
        if (ws) return ws;
    }
    if (provider === 'stripe') return process.env.STRIPE_WEBHOOK_SECRET || '';
    if (provider === 'razorpay') return process.env.RAZORPAY_WEBHOOK_SECRET || '';
    return '';
}

// Which providers are usable right now (vault or env).
async function configuredProviders() {
    const out = [];
    for (const p of PROVIDERS) { if (await resolveConfig(p)) out.push(p); }
    return out;
}

// Resolve the provider for a checkout: an explicit configured request, else the PAYMENT_PROVIDER
// default if configured, else the first configured, else 'manual'.
async function resolveProvider(requested) {
    const configured = await configuredProviders();
    const req = String(requested || '').toLowerCase();
    if (req && configured.includes(req)) return req;
    const def = String(process.env.PAYMENT_PROVIDER || '').toLowerCase();
    if (def && configured.includes(def)) return def;
    return configured[0] || 'manual';
}

const isConfigured = async () => (await configuredProviders()).length > 0;

// Create a checkout/order (amount in major units). Returns { provider, ref, checkoutUrl, status,
// clientParams, raw }. clientParams is the PUBLIC, no-secret payload the browser needs.
async function createCheckout({ provider: requested, amount, currency = 'USD', companyId, planName, invoiceId, successUrl, cancelUrl, customerEmail }) {
    const provider = await resolveProvider(requested);
    const amountMinor = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error('amount must be a positive number');

    if (provider === 'stripe') {
        const cfg = await resolveConfig('stripe');
        const Stripe = require('stripe');
        const stripe = Stripe(cfg.secretKey);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: { currency: currency.toLowerCase(), product_data: { name: planName || 'CTM Plan' }, unit_amount: amountMinor },
                quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail || undefined,
            metadata: { companyId: companyId || '', invoiceId: invoiceId || '' },
        });
        return { provider, ref: session.id, checkoutUrl: session.url, status: 'pending', clientParams: { provider, checkoutUrl: session.url }, raw: { id: session.id } };
    }

    if (provider === 'razorpay') {
        const cfg = await resolveConfig('razorpay');
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
        const order = await rzp.orders.create({ amount: amountMinor, currency, notes: { companyId: companyId || '', invoiceId: invoiceId || '' } });
        // Razorpay has no redirect URL — the browser opens the Checkout modal with the PUBLIC key id.
        return {
            provider, ref: order.id, checkoutUrl: null, status: 'pending',
            clientParams: { provider, keyId: cfg.keyId, orderId: order.id, amount: amountMinor, currency, name: planName || 'CTM Plan', prefillEmail: customerEmail || '' },
            raw: order,
        };
    }

    if (provider === 'payu') {
        // PayU is a redirect/form-POST flow with NO server-to-server API: sign the REQUEST hash and
        // hand the browser the (non-secret) form. PayU posts the result to our hash-verified return
        // route, so settlement is provider-authoritative (a client can never forge a success).
        const cfg = await resolveConfig('payu');
        const base = safeProviderBase(cfg.baseUrl, PAYU_BASES, cfg.mode === 'test' ? 'https://test.payu.in' : 'https://secure.payu.in');
        const amountStr = (amountMinor / 100).toFixed(2);       // PayU uses MAJOR units, 2 decimals
        const txnid = `txn_${crypto.randomBytes(12).toString('hex')}`.slice(0, 25); // unique, ≤25 chars
        const productinfo = String(planName || 'CTM Plan');
        const firstname = (customerEmail ? customerEmail.split('@')[0] : 'customer').slice(0, 60) || 'customer';
        const email = customerEmail || 'billing@controlthemarket.com';
        const hash = payuRequestHash({ key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email, salt: cfg.merchantSalt });
        const ret = process.env.PAYU_RETURN_URL || 'https://controlthemarket.com/api/v1/payments/return/payu';
        return {
            provider, ref: txnid, checkoutUrl: null, status: 'pending',
            clientParams: {
                provider,
                action: `${base}/_payment`,
                // surl/furl/phone are required by PayU's hosted page; only `hash`-covered fields are signed.
                fields: { key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email, phone: process.env.PAYU_DEFAULT_PHONE || '9999999999', surl: ret, furl: ret, hash, ...(currency ? { currency } : {}) },
            },
            raw: { txnid },
        };
    }

    if (provider === 'cashfree') {
        // Cashfree is an order + payment-session + hosted-redirect flow. Create the order server-side
        // (x-client-id/secret), then hand the browser the non-secret payment_session_id for the v3 SDK.
        const cfg = await resolveConfig('cashfree');
        const base = safeProviderBase(cfg.baseUrl, CASHFREE_BASES, cfg.mode === 'test' ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com');
        const cfOrderId = `cfo_${crypto.randomBytes(12).toString('hex')}`;
        const amountMajor = Number((amountMinor / 100).toFixed(2));
        const notifyUrl = process.env.CASHFREE_NOTIFY_URL || 'https://controlthemarket.com/api/v1/payments/webhook';
        const reqBody = {
            order_id: cfOrderId,
            order_amount: amountMajor,
            order_currency: currency,
            customer_details: {
                customer_id: `cust_${crypto.createHash('sha256').update(String(companyId || cfOrderId)).digest('hex').slice(0, 24)}`,
                customer_email: customerEmail || 'billing@controlthemarket.com',
                customer_phone: process.env.CASHFREE_DEFAULT_PHONE || '9999999999',
            },
            order_meta: { return_url: successUrl, notify_url: notifyUrl },
            order_tags: { companyId: String(companyId || ''), invoiceId: String(invoiceId || '') },
        };
        const res = await fetch(`${base}/pg/orders`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-client-id': cfg.clientId, 'x-client-secret': cfg.clientSecret, 'x-api-version': CASHFREE_API_VERSION },
            body: JSON.stringify(reqBody),
        });
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
        if (!res.ok) {
            // Never echo the provider's raw message (may leak detail) — log a code + throw generic.
            console.warn(JSON.stringify({ evt: 'cashfree_order_error', status: res.status, code: data && (data.code || data.type) }));
            throw new Error(`cashfree order failed (${res.status})`);
        }
        const cfRef = data.order_id || cfOrderId;
        const mode = base.includes('sandbox') ? 'sandbox' : 'production';
        return {
            provider, ref: cfRef, checkoutUrl: null, status: 'pending',
            clientParams: { provider, paymentSessionId: data.payment_session_id, orderId: cfRef, mode },
            raw: { order_id: cfRef },
        };
    }

    return { provider: 'manual', ref: 'manual_' + crypto.randomBytes(8).toString('hex'), checkoutUrl: null, status: 'pending', clientParams: { provider: 'manual' }, raw: {} };
}

// Verify + parse a provider webhook. Provider auto-detected from the signature header so ONE
// endpoint serves both. Returns { provider, type, ref, status, amountMinor, currency, metadata,
// eventId, raw } or throws on a bad/unverifiable signature. The webhook secret is REQUIRED.
async function verifyWebhook({ rawBody, headers }) {
    const h = headers || {};

    if (h['stripe-signature']) {
        const secret = await resolveWebhookSecret('stripe');
        if (!secret) throw new Error('Stripe webhook secret not configured');
        const cfg = await resolveConfig('stripe');
        const Stripe = require('stripe');
        // The SDK key is only needed to construct the client for constructEvent(), which performs a
        // purely LOCAL HMAC check using `secret` (already verified non-empty above) — the key is
        // never used for a network call here, so a placeholder is safe when only the webhook secret
        // is vaulted (it does NOT weaken signature verification).
        const stripe = Stripe(cfg?.secretKey || process.env.STRIPE_SECRET_KEY || 'sk_placeholder_unused_for_hmac');
        const evt = stripe.webhooks.constructEvent(rawBody, h['stripe-signature'], secret);
        const obj = evt.data?.object || {};
        const paid = evt.type === 'checkout.session.completed' || evt.type === 'payment_intent.succeeded';
        const amountMinor = obj.amount_total ?? obj.amount_received ?? obj.amount ?? null;
        return {
            provider: 'stripe', type: evt.type, ref: obj.id, status: paid ? 'succeeded' : 'pending',
            amountMinor: amountMinor != null ? Number(amountMinor) : null,
            currency: (obj.currency || '').toUpperCase() || null,
            metadata: obj.metadata || {}, eventId: evt.id, raw: evt,
        };
    }

    if (h['x-razorpay-signature']) {
        const secret = await resolveWebhookSecret('razorpay');
        if (!secret) throw new Error('Razorpay webhook secret not configured');
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const got = String(h['x-razorpay-signature']);
        const a = Buffer.from(expected);
        const b = Buffer.from(got);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid Razorpay signature');
        const evt = JSON.parse(rawBody.toString());
        const paid = evt.event === 'payment.captured' || evt.event === 'order.paid';
        const entity = evt.payload?.payment?.entity || evt.payload?.order?.entity || {};
        const amountMinor = entity.amount != null ? Number(entity.amount) : null;
        return {
            provider: 'razorpay', type: evt.event, ref: entity.order_id || entity.id, status: paid ? 'succeeded' : 'pending',
            amountMinor, currency: (entity.currency || '').toUpperCase() || null,
            metadata: entity.notes || {}, eventId: evt.id || entity.id, raw: evt,
        };
    }

    if (h['x-webhook-signature'] && h['x-webhook-timestamp']) {
        // Cashfree webhook: signature = base64(HMAC-SHA256(timestamp + rawBody, clientSecret)),
        // constant-time compared. The verifying secret is the clientSecret (no separate webhook secret).
        const secret = await resolveWebhookSecret('cashfree');
        if (!secret) throw new Error('Cashfree client secret not configured');
        const ts = String(h['x-webhook-timestamp']);
        // Reject a stale/forward-dated timestamp (±5min) to bound webhook replay (defence-in-depth
        // atop the persistent eventId/idempotency check in the controller).
        const tsSeconds = Number.parseInt(ts, 10);
        if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
            throw new Error('Cashfree webhook timestamp is missing or stale');
        }
        const expected = crypto.createHmac('sha256', secret).update(ts + rawBody.toString('utf8')).digest('base64');
        if (!constantTimeEqual(String(h['x-webhook-signature']), expected)) throw new Error('Invalid Cashfree signature');
        const evt = JSON.parse(rawBody.toString('utf8'));
        const type = String(evt.type || '');
        const paid = type.toUpperCase().startsWith('PAYMENT_SUCCESS');
        const order = (evt.data && evt.data.order) || {};
        const payment = (evt.data && evt.data.payment) || {};
        const amountMinor = order.order_amount != null ? Math.round(Number(order.order_amount) * 100) : null;
        return {
            provider: 'cashfree', type, ref: order.order_id, status: paid ? 'succeeded' : 'pending',
            amountMinor: Number.isFinite(amountMinor) ? amountMinor : null,
            currency: (order.order_currency || '').toUpperCase() || null,
            metadata: (evt.data && evt.data.order_tags) || {},
            eventId: payment.cf_payment_id || (order.order_id ? `${type}:${order.order_id}` : null),
            raw: evt,
        };
    }

    throw new Error('Unrecognized webhook: no Stripe, Razorpay, or Cashfree signature header');
}

// Verify a PayU form-POST return (no signature header — SHA-512 REVERSE hash over the posted fields,
// constant-time compared to the body's `hash`). REQUIRES the merchant secrets. Returns boolean.
async function verifyPayuReturn(body) {
    if (!body || !body.hash) return false;
    const cfg = await resolveConfig('payu');
    if (!cfg) return false; // unconfigured → fail closed
    const expected = payuResponseHash({
        salt: cfg.merchantSalt, status: body.status, email: body.email, firstname: body.firstname,
        productinfo: body.productinfo, amount: body.amount, txnid: body.txnid, key: cfg.merchantKey,
    });
    return constantTimeEqual(body.hash, expected);
}

// Parse an (already hash-verified) PayU return body into the canonical settlement shape.
function parsePayuReturn(body) {
    const s = String((body && body.status) || '').toLowerCase();
    const status = s === 'success' ? 'succeeded' : (s === 'refunded' ? 'refunded' : 'failed');
    return {
        status,
        txnid: (body && body.txnid) || null,
        mihpayid: (body && body.mihpayid) || null,
        amountMajor: body && body.amount,
        currency: ((body && body.currency) || '').toUpperCase() || null,
    };
}

// Pre-flight self-check for go-live: confirms, WITHOUT exposing any secret, that each provider's
// checkout keys + webhook secret are actually resolvable (from the vault or env) right now.
async function healthCheck() {
    const out = { vault: { configured: Boolean(CMS_BASE_URL && INTERNAL_SECRET), slug: SITE_SLUG }, providers: [] };
    for (const p of PROVIDERS) {
        const cfg = await resolveConfig(p);
        const wsec = await resolveWebhookSecret(p);
        out[p] = { checkout: Boolean(cfg), webhook: Boolean(wsec), source: cfg?.source || (wsec ? 'webhook-only' : 'none') };
        if (cfg) out.providers.push(p);
    }
    out.ready = out.providers.length > 0 && out.providers.every((p) => out[p].webhook);
    return out;
}

module.exports = {
    configuredProviders, resolveProvider, isConfigured, createCheckout, verifyWebhook,
    verifyPayuReturn, parsePayuReturn, resolveConfig, resolveWebhookSecret, healthCheck,
    // exported for unit tests of the signing/verification primitives
    _internal: { payuRequestHash, payuResponseHash, constantTimeEqual, safeProviderBase },
};
