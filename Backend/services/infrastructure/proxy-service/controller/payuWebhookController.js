'use strict';
/**
 * PayU callback / webhook — the authoritative trigger for PayU payments.
 *
 * PayU is a redirect/form-POST flow (NOT an in-SPA modal like Razorpay): after the shopper pays on
 * PayU's hosted page, PayU browser-POSTs the result (form-encoded) to our `surl`/`furl` = this
 * endpoint. There is no signature header — authenticity is PayU's SHA-512 REVERSE hash recomputed
 * over the posted fields and constant-time compared to the body's `hash` (same scheme the Java
 * PayUGateway verifies). PayU can't carry tenant `notes` like Razorpay, so we map the payment back
 * via the (hash-verified) shopper EMAIL → user → org → their subscription, then activate/credit
 * idempotently. Finally we 302 the browser to the app's result page.
 *
 * Mounted in index.js with express.raw BEFORE the JSON/urlencoded parsers (the hash is over the
 * exact posted bytes).
 */
const crypto = require('crypto');
const billingService = require('../service/billingService');
const store = require('../service/platformStore');
const config = require('../config/appConfig');
const logger = require('../service/logger');

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || '';
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT || '';
if (process.env.NODE_ENV === 'production' && (!PAYU_KEY || !PAYU_SALT)) {
    throw new Error('PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT must be set in production (PayU callback verification)');
}
const APP_URL = process.env.PUBLIC_APP_URL || (config.corsOrigins && config.corsOrigins[0]) || 'http://localhost:8080';

const processedTxnIds = new Set(); // in-proc idempotency; durable dedup also via credit ref + invoice window

const sha512Hex = (s) => crypto.createHash('sha512').update(String(s), 'utf8').digest('hex');
const orEmpty = (v) => (v == null ? '' : v);
function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}
function parseForm(raw) {
    const out = {};
    String(raw || '').trim().split('&').forEach((pair) => {
        if (!pair) return;
        const i = pair.indexOf('=');
        const k = i >= 0 ? pair.slice(0, i) : pair;
        const v = i >= 0 ? pair.slice(i + 1) : '';
        try { out[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch { /* skip malformed pair */ }
    });
    return out;
}
const landing = (outcome) => `${APP_URL.replace(/\/$/, '')}/app/billing/checkout?payu=${outcome}`;

async function payuWebhook(req, res) {
    try {
        if (!PAYU_KEY || !PAYU_SALT) {
            logger.error('[payu-webhook] PayU merchant key/salt not configured');
            return res.status(503).json({ error: { code: 'PAYU_NOT_CONFIGURED', message: 'PayU not configured' } });
        }
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        const body = parseForm(raw.toString('utf8'));
        const supplied = body.hash;
        if (!supplied) return res.status(400).json({ error: { code: 'NO_HASH', message: 'missing hash' } });

        // Reverse hash: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
        const expected = sha512Hex(
            `${PAYU_SALT}|${orEmpty(body.status)}|||||||||||${orEmpty(body.email)}|${orEmpty(body.firstname)}|${orEmpty(body.productinfo)}|${orEmpty(body.amount)}|${orEmpty(body.txnid)}|${PAYU_KEY}`,
        );
        if (!timingSafeEqual(supplied, expected)) {
            logger.warn('[payu-webhook] hash verification failed');
            return res.status(400).json({ error: { code: 'BAD_HASH', message: 'hash verification failed' } });
        }

        const txnid = body.txnid || null;
        const status = String(body.status || '').toLowerCase();
        if (status !== 'success') {
            return res.redirect(302, landing('failed'));
        }
        if (txnid && processedTxnIds.has(txnid)) {
            return res.redirect(302, landing('success'));
        }

        const email = body.email ? String(body.email).toLowerCase() : '';
        const user = email ? await store.findUserByEmail(email) : null;
        if (!user || !user.orgId) {
            logger.warn('[payu-webhook] no user/org for the (verified) payer email — cannot activate');
            return res.redirect(302, landing('error'));
        }
        const auth = { orgId: user.orgId, userId: user.id };
        const amountMajor = Number(body.amount);
        if (!(amountMajor > 0)) return res.redirect(302, landing('error'));

        // Map the payment to the org's CURRENT plan: pay-as-you-go → prepaid credit, else activate it.
        const sub = await billingService.getSubscription(auth);
        const planSlug = sub && sub.planSlug ? sub.planSlug : null;
        const ref = `payu:${txnid}`;

        if (planSlug === 'pay-as-you-go') {
            await billingService.purchaseCredit(auth, amountMajor, { ref });
            if (txnid) processedTxnIds.add(txnid);
            logger.info(`[payu-webhook] credited org=${auth.orgId} amount=${amountMajor} txnid=${txnid}`);
            return res.redirect(302, landing('success'));
        }
        if (!planSlug) {
            logger.warn('[payu-webhook] payer has no subscription to activate');
            return res.redirect(302, landing('error'));
        }
        await billingService.activateSubscription(auth, planSlug, { amount: amountMajor, paymentRef: ref });
        if (txnid) processedTxnIds.add(txnid);
        logger.info(`[payu-webhook] activated org=${auth.orgId} plan=${planSlug} txnid=${txnid}`);
        return res.redirect(302, landing('success'));
    } catch (e) {
        logger.error('[payu-webhook] handler error:', e.message);
        return res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'internal error' } });
    }
}

module.exports = { payuWebhook };
