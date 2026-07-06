'use strict';
/**
 * Stripe webhook — the authoritative trigger for Stripe (hosted Checkout) payments.
 *
 * The proxy site uses Stripe Checkout: after payment Stripe redirects the shopper to the session's
 * success_url (SPA landing) AND sends this S2S webhook. We verify Stripe's signed-payload scheme —
 * the `stripe-signature` header is `t=<ts>,v1=<hex>[,v1=...]`, and the signature is
 * HMAC-SHA256(`<ts>.<rawBody>`, webhookSecret) compared constant-time to each v1, within a tolerance
 * window. On `checkout.session.completed` we map the payment to the tenant via the session metadata
 * we stamped at checkout (orgId/planSlug/kind — signature-verified, so tamper-proof), falling back
 * to the customer email, and activate the subscription or PAYG credit idempotently. 200 JSON.
 *
 * Mounted in index.js with express.raw BEFORE the JSON parser (signature is over the raw bytes).
 */
const crypto = require('crypto');
const billingService = require('../service/billingService');
const store = require('../service/platformStore');
const logger = require('../service/logger');

const cmsVault = require('../service/cmsVault');
const dedup = require('../service/webhookDedup');
// Secret comes from the CMS vault (the central admin panel) first; env is a local/dev fallback.
const STRIPE_WEBHOOK_SECRET_ENV = process.env.STRIPE_WEBHOOK_SECRET || '';
const TOLERANCE_SECONDS = Number(process.env.STRIPE_TOLERANCE_SECONDS || 300);
// Idempotency is now DURABLE + instance-shared via public.payment_webhook_events
// (dedup.claimEvent / markApplied). The old per-process in-memory Set lost all dedup
// state on restart and could not coordinate across instances → double-credit on redelivery.

function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

/** Parse Stripe's `t=...,v1=...,v1=...` signature header. */
function parseSigHeader(header) {
    let t = null;
    const v1 = [];
    String(header || '').split(',').forEach((part) => {
        const i = part.indexOf('=');
        if (i < 0) return;
        const k = part.slice(0, i).trim();
        const v = part.slice(i + 1).trim();
        if (k === 't') t = v;
        else if (k === 'v1') v1.push(v);
    });
    return { t, v1 };
}

async function stripeWebhook(req, res) {
    // Tracks a FRESH idempotency claim so the catch can release it on apply-failure (else the orphaned
    // claim dedups Stripe's retry → payment captured, never fulfilled). See internalFulfillController.
    let claimedId = null;
    try {
        const STRIPE_WEBHOOK_SECRET = (await cmsVault.getSecret('stripe', 'webhookSecret')) || STRIPE_WEBHOOK_SECRET_ENV;
        if (!STRIPE_WEBHOOK_SECRET) {
            logger.error('[stripe-webhook] no Stripe webhook secret (vault or env)');
            return res.status(503).json({ error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' } });
        }
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        const { t, v1 } = parseSigHeader(req.headers['stripe-signature']);
        if (!t || v1.length === 0) {
            return res.status(400).json({ error: { code: 'NO_SIGNATURE', message: 'missing/malformed stripe-signature' } });
        }
        const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
        if (!Number.isFinite(skew) || skew > TOLERANCE_SECONDS) {
            return res.status(400).json({ error: { code: 'STALE', message: 'timestamp outside tolerance' } });
        }
        const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(`${t}.${raw.toString('utf8')}`).digest('hex');
        if (!v1.some((sig) => timingSafeEqual(sig, expected))) {
            logger.warn('[stripe-webhook] signature verification failed');
            return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'signature verification failed' } });
        }

        let event;
        try { event = JSON.parse(raw.toString('utf8')); } catch {
            return res.status(400).json({ error: { code: 'BAD_PAYLOAD', message: 'invalid JSON' } });
        }
        const type = event.type || '';
        if (type !== 'checkout.session.completed' && type !== 'payment_intent.succeeded') {
            return res.status(200).json({ received: true, ignored: type || 'unknown' });
        }
        const obj = (event.data && event.data.object) || {};
        // For checkout.session, paid sessions only.
        if (type === 'checkout.session.completed' && obj.payment_status && obj.payment_status !== 'paid') {
            return res.status(200).json({ received: true, ignored: `unpaid-${obj.payment_status}` });
        }
        const eventId = event.id || obj.id || null;

        const md = obj.metadata || {};
        // amount_total (checkout.session) / amount_received (payment_intent) are in MINOR units.
        const minor = obj.amount_total != null ? Number(obj.amount_total) : Number(obj.amount_received);
        const amountMajor = Number.isFinite(minor) ? minor / 100 : NaN;
        if (!(amountMajor > 0)) return res.status(200).json({ received: true, ignored: 'no-amount' });

        // Map to the tenant: prefer the signature-verified metadata.orgId; else the payer email.
        let orgId = md.orgId || null;
        let userId = md.userId || null;
        let planSlug = md.planSlug || null;
        const kind = md.kind || (planSlug === 'pay-as-you-go' ? 'credit' : null);
        if (!orgId) {
            const email = (obj.customer_email || (obj.customer_details && obj.customer_details.email) || '').toLowerCase();
            if (email) {
                const user = await store.findUserByEmail(email);
                if (user && user.orgId) { orgId = user.orgId; userId = userId || user.id; }
            }
        }
        if (!orgId) {
            logger.warn('[stripe-webhook] could not map payment to a tenant (no metadata.orgId / email)');
            return res.status(200).json({ received: true, ignored: 'unknown-tenant' });
        }

        const auth = { orgId, userId };
        const ref = `stripe:${obj.payment_intent || obj.id || eventId}`;
        // Fall back to the org's current plan when metadata is absent (e.g. payment_intent flow).
        if (!planSlug || !kind) {
            const sub = await billingService.getSubscription(auth);
            planSlug = planSlug || (sub && sub.planSlug) || null;
        }
        const currency = obj.currency ? String(obj.currency).toUpperCase() : null;

        // Durable idempotency gate: atomically claim this signature-verified event id. A replay,
        // a concurrent redelivery, or a post-restart redelivery loses the INSERT race and no-ops.
        // (Throws on DB error → outer catch → 5xx → Stripe retries; i.e. fails closed, never an
        // unguarded apply.) A missing event id falls through to the credit-ref dedup backstop.
        if (eventId) {
            const claim = await dedup.claimEvent('stripe', eventId, { eventType: type, orgId, amount: amountMajor, currency });
            if (!claim.fresh) {
                return res.status(200).json({ received: true, idempotent: true });
            }
            claimedId = eventId;
        }

        if (kind === 'credit' || planSlug === 'pay-as-you-go') {
            const bal = await billingService.purchaseCredit(auth, amountMajor, { ref });
            if (eventId) await dedup.markApplied('stripe', eventId, { status: 'applied', orgId, amount: amountMajor, currency });
            logger.info(`[stripe-webhook] credited org=${orgId} amount=${amountMajor} event=${eventId}`);
            return res.status(200).json({ received: true, credited: true, balanceUsd: bal && bal.balanceUsd });
        }
        if (!planSlug) {
            return res.status(200).json({ received: true, ignored: 'no-subscription' });
        }
        const activated = await billingService.activateSubscription(auth, planSlug, { amount: amountMajor, paymentRef: ref });
        if (eventId) await dedup.markApplied('stripe', eventId, { status: 'applied', orgId, amount: amountMajor, currency });
        logger.info(`[stripe-webhook] activated org=${orgId} plan=${planSlug} event=${eventId}`);
        return res.status(200).json({ received: true, activated: true, status: activated && activated.status });
    } catch (e) {
        // Release the (unapplied) claim so Stripe's retry can re-fulfill. releaseEvent only deletes rows
        // still applied=FALSE, so it can never undo a completed activation. 500 → Stripe retries.
        if (claimedId) { try { await dedup.releaseEvent('stripe', claimedId); } catch (_) { /* best-effort */ } }
        logger.error('[stripe-webhook] handler error:', e.message);
        return res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'internal error' } });
    }
}

module.exports = { stripeWebhook };
