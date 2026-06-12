'use strict';
// Provider-agnostic payments. The concrete adapter is chosen from env at call time;
// SDKs are required lazily so the service runs fine with NO provider configured
// (it falls back to a 'manual' record so the billing UI still works end-to-end).
//
//   Stripe:   PAYMENT_PROVIDER=stripe   STRIPE_SECRET_KEY=...   STRIPE_WEBHOOK_SECRET=...
//   Razorpay: PAYMENT_PROVIDER=razorpay RAZORPAY_KEY_ID=...     RAZORPAY_KEY_SECRET=...
const crypto = require('crypto');

function activeProvider() {
    const p = (process.env.PAYMENT_PROVIDER || '').toLowerCase();
    if (p === 'stripe' && process.env.STRIPE_SECRET_KEY) return 'stripe';
    if (p === 'razorpay' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return 'razorpay';
    // Auto-detect if PAYMENT_PROVIDER unset but keys present.
    if (!p && process.env.STRIPE_SECRET_KEY) return 'stripe';
    if (!p && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return 'razorpay';
    return 'manual';
}

const isConfigured = () => activeProvider() !== 'manual';

// Create a checkout/order for an amount. Returns { provider, ref, checkoutUrl, status, raw }.
async function createCheckout({ amount, currency = 'USD', companyId, planName, invoiceId, successUrl, cancelUrl, customerEmail }) {
    const provider = activeProvider();

    if (provider === 'stripe') {
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: { name: planName || 'CTM Plan' },
                    unit_amount: Math.round(Number(amount) * 100),
                },
                quantity: 1,
            }],
            success_url: successUrl || process.env.PAYMENT_SUCCESS_URL || 'https://controlthemarket.com/company/billing?paid=1',
            cancel_url: cancelUrl || process.env.PAYMENT_CANCEL_URL || 'https://controlthemarket.com/company/billing?canceled=1',
            customer_email: customerEmail,
            metadata: { companyId: companyId || '', invoiceId: invoiceId || '' },
        });
        return { provider, ref: session.id, checkoutUrl: session.url, status: 'pending', raw: { id: session.id } };
    }

    if (provider === 'razorpay') {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const order = await rzp.orders.create({
            amount: Math.round(Number(amount) * 100),
            currency,
            notes: { companyId: companyId || '', invoiceId: invoiceId || '' },
        });
        return { provider, ref: order.id, checkoutUrl: null, status: 'pending', raw: order };
    }

    // No provider configured — manual record (invoice flow still works for dev/demo).
    return { provider: 'manual', ref: 'manual_' + crypto.randomBytes(8).toString('hex'), checkoutUrl: null, status: 'pending', raw: {} };
}

// Verify + parse a provider webhook. Returns { type, ref, status, raw } or throws on bad signature.
function verifyWebhook({ provider, rawBody, headers }) {
    const prov = provider || activeProvider();
    if (prov === 'stripe') {
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const evt = stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
        const obj = evt.data?.object || {};
        const paid = evt.type === 'checkout.session.completed' || evt.type === 'payment_intent.succeeded';
        return { type: evt.type, ref: obj.id, status: paid ? 'succeeded' : 'pending', metadata: obj.metadata || {}, raw: evt };
    }
    if (prov === 'razorpay') {
        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
            .update(rawBody).digest('hex');
        if (headers['x-razorpay-signature'] !== expected) throw new Error('Invalid Razorpay signature');
        const evt = JSON.parse(rawBody.toString());
        const paid = evt.event === 'payment.captured' || evt.event === 'order.paid';
        const entity = evt.payload?.payment?.entity || evt.payload?.order?.entity || {};
        return { type: evt.event, ref: entity.order_id || entity.id, status: paid ? 'succeeded' : 'pending', metadata: entity.notes || {}, raw: evt };
    }
    throw new Error('No payment provider configured for webhook verification');
}

module.exports = { activeProvider, isConfigured, createCheckout, verifyWebhook };
