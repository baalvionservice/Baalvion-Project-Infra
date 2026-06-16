'use strict';
/**
 * Razorpay billing webhook — the AUTHORITATIVE subscription-activation trigger.
 *
 * Razorpay POSTs `payment.captured` / `order.paid` to this endpoint (configured in the Razorpay
 * dashboard → the public URL of this service). We verify the HMAC signature over the RAW body, then
 * activate the tenant's subscription from the order `notes` we set at checkout (orgId/userId/planSlug
 * — all server-trusted, never browser-supplied). This makes the provider the source of truth: even
 * if the browser never calls /billing/activate (closed tab, network drop), the paid subscription
 * still activates.
 *
 * Mounted in index.js with express.raw BEFORE the JSON body parser (signatures are computed over the
 * exact bytes). No JWT — authenticity comes from the signature.
 *
 * Idempotency: a payment can be delivered more than once (provider retries) AND the browser may also
 * call /billing/activate for the same payment. We dedup by razorpay payment id here, and
 * billingService.activateSubscription additionally dedups the invoice. NOTE: this dedup set is
 * in-process — production should persist processed event ids (e.g. a payment_events table) so a
 * restart can't let a redelivery create a duplicate invoice.
 */
const crypto = require('crypto');
const billingService = require('../service/billingService');
const logger = require('../service/logger');

const cmsVault = require('../service/cmsVault');
const dedup = require('../service/webhookDedup');
// Secret comes from the CMS vault (the central admin panel) first; env is a local/dev fallback.
const WEBHOOK_SECRET_ENV = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const ACTIONABLE = new Set(['payment.captured', 'order.paid']);
// Idempotency is now DURABLE + instance-shared via public.payment_webhook_events keyed on the
// signature-verified Razorpay payment id (resolving the in-process-Set note above). This persists
// processed event ids across restarts and instances so a redelivery can never double-credit.

function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

async function razorpayWebhook(req, res) {
    try {
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            return res.status(400).json({ error: { code: 'NO_SIGNATURE', message: 'missing x-razorpay-signature' } });
        }
        const secret = (await cmsVault.getSecret('razorpay', 'webhookSecret')) || WEBHOOK_SECRET_ENV;
        if (!secret) {
            logger.error('[billing-webhook] no Razorpay webhook secret (vault or env)');
            return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'webhook secret not configured' } });
        }
        const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
        if (!timingSafeEqual(signature, expected)) {
            logger.warn('[billing-webhook] razorpay signature verification failed');
            return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'signature verification failed' } });
        }

        let event;
        try { event = JSON.parse(raw.toString('utf8')); } catch {
            return res.status(400).json({ error: { code: 'BAD_PAYLOAD', message: 'invalid JSON' } });
        }

        const type = event && event.event;
        if (!ACTIONABLE.has(type)) {
            return res.status(200).json({ received: true, ignored: type || 'unknown' });
        }

        const payment = event.payload && event.payload.payment && event.payload.payment.entity;
        if (!payment) {
            return res.status(200).json({ received: true, ignored: 'no-payment-entity' });
        }

        const paymentId = payment.id || null;

        const notes = payment.notes || {};
        const orgId = notes.orgId;
        const planSlug = notes.planSlug;
        const userId = notes.userId || null;
        const interval = notes.interval === 'yearly' ? 'yearly' : 'monthly';
        // 'credit' = PAYG prepaid top-up; 'subscription' = monthly/yearly plan. Fall back by slug.
        const kind = notes.kind || (planSlug === 'pay-as-you-go' ? 'credit' : 'subscription');
        if (!orgId) {
            logger.warn('[billing-webhook] payment.captured missing orgId note — cannot map to a tenant');
            return res.status(200).json({ received: true, ignored: 'missing-notes' });
        }

        const amountMajor = typeof payment.amount === 'number' ? payment.amount / 100 : undefined;
        const auth = { orgId, userId };
        const currency = payment.currency ? String(payment.currency).toUpperCase() : null;

        // Durable idempotency gate: atomically claim this signature-verified Razorpay payment id. A
        // redelivery / concurrent / post-restart delivery loses the INSERT race and no-ops. Throws on
        // DB error → outer catch → 5xx → Razorpay retries (fails closed, never an unguarded apply).
        if (paymentId) {
            const claim = await dedup.claimEvent('razorpay', paymentId, { eventType: type, orgId, amount: amountMajor, currency });
            if (!claim.fresh) {
                return res.status(200).json({ received: true, idempotent: true });
            }
        }

        if (kind === 'credit') {
            // PAYG: add prepaid credit, keyed to this payment id (idempotent — the client convenience
            // call and this webhook net exactly one top-up).
            if (!(amountMajor > 0)) {
                return res.status(200).json({ received: true, ignored: 'no-amount' });
            }
            const bal = await billingService.purchaseCredit(auth, amountMajor, { ref: paymentId });
            if (paymentId) await dedup.markApplied('razorpay', paymentId, { status: 'applied', orgId, amount: amountMajor, currency });
            logger.info(`[billing-webhook] credited org=${orgId} amount=${amountMajor} via payment=${paymentId} balance=${bal && bal.balanceUsd}`);
            return res.status(200).json({ received: true, credited: true, balanceUsd: bal && bal.balanceUsd });
        }

        // Subscription activation.
        if (!planSlug) {
            logger.warn('[billing-webhook] subscription payment missing planSlug note — cannot activate');
            return res.status(200).json({ received: true, ignored: 'missing-notes' });
        }
        const sub = await billingService.activateSubscription(auth, planSlug, {
            amount: amountMajor,
            interval,
            paymentRef: paymentId,
        });
        if (paymentId) await dedup.markApplied('razorpay', paymentId, { status: 'applied', orgId, amount: amountMajor, currency });
        logger.info(`[billing-webhook] activated org=${orgId} plan=${planSlug} via payment=${paymentId} status=${sub && sub.status}`);
        return res.status(200).json({ received: true, activated: true, status: sub && sub.status });
    } catch (e) {
        // 500 so the provider retries (idempotency above makes retries safe).
        logger.error('[billing-webhook] handler error:', e.message);
        return res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'internal error' } });
    }
}

module.exports = { razorpayWebhook };
