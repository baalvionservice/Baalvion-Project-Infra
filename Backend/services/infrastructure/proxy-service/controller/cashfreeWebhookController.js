'use strict';
/**
 * Cashfree webhook — the authoritative trigger for Cashfree payments.
 *
 * Cashfree is an order + payment-session + hosted-redirect flow. After payment it (a) browser-
 * redirects the shopper to the order's return_url (the SPA landing) and (b) sends a server-to-server
 * webhook here. This endpoint is the S2S sink: it verifies Cashfree's signature
 * `base64(HMAC-SHA256(x-webhook-timestamp + rawBody, clientSecret))` against the `x-webhook-signature`
 * header, then maps the payment to the tenant via the (signed) customer_email → user → org and
 * activates the subscription or PAYG credit idempotently. Returns 200 JSON (Cashfree expects 2xx).
 *
 * Mounted in index.js with express.raw BEFORE the JSON parser (the signature is over the raw bytes).
 */
const crypto = require('crypto');
const billingService = require('../service/billingService');
const store = require('../service/platformStore');
const logger = require('../service/logger');

const cmsVault = require('../service/cmsVault');
// Cashfree's webhook secret IS the client secret. Vault (central admin panel) first; env fallback.
const CASHFREE_SECRET_ENV = process.env.CASHFREE_CLIENT_SECRET || '';

const processedEventIds = new Set(); // in-proc idempotency; durable dedup also via credit ref + invoice window

function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

async function cashfreeWebhook(req, res) {
    try {
        const CASHFREE_SECRET = (await cmsVault.getSecret('cashfree', 'clientSecret')) || CASHFREE_SECRET_ENV;
        if (!CASHFREE_SECRET) {
            logger.error('[cashfree-webhook] no Cashfree client secret (vault or env)');
            return res.status(503).json({ error: { code: 'CASHFREE_NOT_CONFIGURED', message: 'Cashfree not configured' } });
        }
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        if (!signature || !timestamp) {
            return res.status(400).json({ error: { code: 'NO_SIGNATURE', message: 'missing signature/timestamp' } });
        }
        // base64(HMAC-SHA256(timestamp + rawBody, clientSecret)) — Cashfree's documented scheme.
        const expected = crypto.createHmac('sha256', CASHFREE_SECRET).update(String(timestamp) + raw.toString('utf8')).digest('base64');
        if (!timingSafeEqual(signature, expected)) {
            logger.warn('[cashfree-webhook] signature verification failed');
            return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'signature verification failed' } });
        }

        let event;
        try { event = JSON.parse(raw.toString('utf8')); } catch {
            return res.status(400).json({ error: { code: 'BAD_PAYLOAD', message: 'invalid JSON' } });
        }

        const type = String(event.type || '');
        if (!type.toUpperCase().startsWith('PAYMENT_SUCCESS')) {
            return res.status(200).json({ received: true, ignored: type || 'unknown' });
        }
        const data = event.data || {};
        const order = data.order || {};
        const payment = data.payment || {};
        const cust = data.customer_details || {};
        const eventId = payment.cf_payment_id || payment.payment_id || order.order_id || null;
        if (eventId && processedEventIds.has(String(eventId))) {
            return res.status(200).json({ received: true, idempotent: true });
        }

        const email = cust.customer_email ? String(cust.customer_email).toLowerCase() : '';
        if (!email) {
            logger.warn('[cashfree-webhook] no customer_email in event — cannot map to a tenant');
            return res.status(200).json({ received: true, ignored: 'no-email' });
        }
        const user = await store.findUserByEmail(email);
        if (!user || !user.orgId) {
            logger.warn('[cashfree-webhook] no user/org for the payer email');
            return res.status(200).json({ received: true, ignored: 'unknown-user' });
        }
        const auth = { orgId: user.orgId, userId: user.id };
        const amountMajor = Number(order.order_amount);
        if (!(amountMajor > 0)) return res.status(200).json({ received: true, ignored: 'no-amount' });

        const sub = await billingService.getSubscription(auth);
        const planSlug = sub && sub.planSlug ? sub.planSlug : null;
        const ref = `cashfree:${eventId}`;

        if (planSlug === 'pay-as-you-go') {
            const bal = await billingService.purchaseCredit(auth, amountMajor, { ref });
            if (eventId) processedEventIds.add(String(eventId));
            logger.info(`[cashfree-webhook] credited org=${auth.orgId} amount=${amountMajor} event=${eventId}`);
            return res.status(200).json({ received: true, credited: true, balanceUsd: bal && bal.balanceUsd });
        }
        if (!planSlug) {
            logger.warn('[cashfree-webhook] payer has no subscription to activate');
            return res.status(200).json({ received: true, ignored: 'no-subscription' });
        }
        const activated = await billingService.activateSubscription(auth, planSlug, { amount: amountMajor, paymentRef: ref });
        if (eventId) processedEventIds.add(String(eventId));
        logger.info(`[cashfree-webhook] activated org=${auth.orgId} plan=${planSlug} event=${eventId}`);
        return res.status(200).json({ received: true, activated: true, status: activated && activated.status });
    } catch (e) {
        logger.error('[cashfree-webhook] handler error:', e.message);
        return res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'internal error' } });
    }
}

module.exports = { cashfreeWebhook };
