'use strict';
// Provider-agnostic payments. Keys are resolved from the CENTRAL CMS vault — the admin panel's
// "Integrations & Keys" for the CTM website slug (control-the-market). Paste a Stripe/Razorpay key
// in the console and checkout uses it immediately, NO redeploy and NO secret in this service's env.
// process.env is only a fallback for local dev when the vault is unreachable. SDKs load lazily so
// the service boots with nothing configured (it then runs in 'manual' mode — dev/demo only).
//
//   Vault (per website slug, category=payment):  stripe → { secretKey, webhookSecret }
//                                                razorpay → { keyId, keySecret, webhookSecret }
//   Env fallback (dev only): STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET, RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET
const crypto = require('crypto');

const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'control-the-market';
const CMS_BASE_URL = process.env.CMS_BASE_URL || '';            // e.g. http://cms-service:3011/api/v1
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const VAULT_TTL_MS = 60_000;

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
        if (provider === 'stripe' && s.secretKey) return { source: 'vault', secretKey: s.secretKey, webhookSecret, mode: cfg.mode || 'live' };
        if (provider === 'razorpay' && s.keyId && s.keySecret) return { source: 'vault', keyId: s.keyId, keySecret: s.keySecret, webhookSecret, mode: cfg.mode || 'live' };
    }
    if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) return { source: 'env', secretKey: process.env.STRIPE_SECRET_KEY, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '', mode: 'env' };
    if (provider === 'razorpay' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return { source: 'env', keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '', mode: 'env' };
    return null;
}

// Resolve the WEBHOOK secret for a provider (vault first, then env) — independent of order keys so
// signature verification works even when only the webhook secret is present.
async function resolveWebhookSecret(provider) {
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
    for (const p of ['stripe', 'razorpay']) { if (await resolveConfig(p)) out.push(p); }
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

    throw new Error('Unrecognized webhook: no Stripe or Razorpay signature header');
}

module.exports = { configuredProviders, resolveProvider, isConfigured, createCheckout, verifyWebhook, resolveConfig, resolveWebhookSecret };
