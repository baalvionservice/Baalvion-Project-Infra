'use strict';
// Provider-agnostic payments. Both Stripe and Razorpay can be configured at once; the
// concrete adapter is chosen PER REQUEST (the buyer picks at checkout). SDKs are required
// lazily so the service runs fine with NO provider configured (it falls back to a 'manual'
// record so the billing UI still works end-to-end in dev/demo — never in production).
//
//   Stripe:   STRIPE_SECRET_KEY=...        STRIPE_WEBHOOK_SECRET=...
//   Razorpay: RAZORPAY_KEY_ID=...          RAZORPAY_KEY_SECRET=...   RAZORPAY_WEBHOOK_SECRET=...
//   Default when the request omits a provider: PAYMENT_PROVIDER (else the first configured one).
const crypto = require('crypto');

// Which providers actually have credentials wired.
function configuredProviders() {
    const out = [];
    if (process.env.STRIPE_SECRET_KEY) out.push('stripe');
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) out.push('razorpay');
    return out;
}

// Resolve the provider for a checkout: honour an explicit, configured request; else the
// PAYMENT_PROVIDER default if configured; else the first configured provider; else 'manual'.
function resolveProvider(requested) {
    const configured = configuredProviders();
    const req = String(requested || '').toLowerCase();
    if (req && configured.includes(req)) return req;
    const def = String(process.env.PAYMENT_PROVIDER || '').toLowerCase();
    if (def && configured.includes(def)) return def;
    return configured[0] || 'manual';
}

const isConfigured = () => configuredProviders().length > 0;
// Back-compat: the "active" provider when none is explicitly requested.
const activeProvider = () => resolveProvider();

// Create a checkout/order for an amount (major units). Returns
// { provider, ref, checkoutUrl, status, clientParams, raw }. `clientParams` is the public,
// no-secret payload the browser needs (Stripe: a redirect URL; Razorpay: the public key id +
// order id to open the hosted Checkout modal).
async function createCheckout({ provider: requested, amount, currency = 'USD', companyId, planName, invoiceId, successUrl, cancelUrl, customerEmail }) {
    const provider = resolveProvider(requested);
    const amountMinor = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error('amount must be a positive number');

    if (provider === 'stripe') {
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: { name: planName || 'CTM Plan' },
                    unit_amount: amountMinor,
                },
                quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail || undefined,
            metadata: { companyId: companyId || '', invoiceId: invoiceId || '' },
        });
        return {
            provider, ref: session.id, checkoutUrl: session.url, status: 'pending',
            clientParams: { provider, checkoutUrl: session.url },
            raw: { id: session.id },
        };
    }

    if (provider === 'razorpay') {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const order = await rzp.orders.create({
            amount: amountMinor,
            currency,
            notes: { companyId: companyId || '', invoiceId: invoiceId || '' },
        });
        // Razorpay has no redirect URL — the browser opens the Checkout modal with the PUBLIC
        // key id + order id. The key SECRET is never sent to the client.
        return {
            provider, ref: order.id, checkoutUrl: null, status: 'pending',
            clientParams: {
                provider, keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id,
                amount: amountMinor, currency, name: planName || 'CTM Plan',
                prefillEmail: customerEmail || '',
            },
            raw: order,
        };
    }

    // No provider configured — manual record (invoice flow still works for dev/demo only).
    return {
        provider: 'manual', ref: 'manual_' + crypto.randomBytes(8).toString('hex'),
        checkoutUrl: null, status: 'pending', clientParams: { provider: 'manual' }, raw: {},
    };
}

// Verify + parse a provider webhook. The provider is auto-detected from the signature header
// so ONE endpoint serves both Stripe and Razorpay. Returns
// { provider, type, ref, status, amountMinor, currency, metadata, eventId, raw } or throws on
// a bad/unverifiable signature. Webhook secrets are REQUIRED — there is no key-secret fallback.
function verifyWebhook({ rawBody, headers }) {
    const h = headers || {};

    if (h['stripe-signature']) {
        if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Stripe webhook secret not configured');
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const evt = stripe.webhooks.constructEvent(rawBody, h['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
        const obj = evt.data?.object || {};
        const paid = evt.type === 'checkout.session.completed' || evt.type === 'payment_intent.succeeded';
        const amountMinor = obj.amount_total ?? obj.amount_received ?? obj.amount ?? null;
        return {
            provider: 'stripe', type: evt.type, ref: obj.id,
            status: paid ? 'succeeded' : 'pending',
            amountMinor: amountMinor != null ? Number(amountMinor) : null,
            currency: (obj.currency || '').toUpperCase() || null,
            metadata: obj.metadata || {}, eventId: evt.id, raw: evt,
        };
    }

    if (h['x-razorpay-signature']) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
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
            provider: 'razorpay', type: evt.event, ref: entity.order_id || entity.id,
            status: paid ? 'succeeded' : 'pending',
            amountMinor, currency: (entity.currency || '').toUpperCase() || null,
            metadata: entity.notes || {}, eventId: evt.id || entity.id, raw: evt,
        };
    }

    throw new Error('Unrecognized webhook: no Stripe or Razorpay signature header');
}

module.exports = { activeProvider, resolveProvider, configuredProviders, isConfigured, createCheckout, verifyWebhook };
