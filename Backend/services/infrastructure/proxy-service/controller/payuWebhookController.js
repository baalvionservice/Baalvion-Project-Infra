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

const cmsVault = require('../service/cmsVault');
const dedup = require('../service/webhookDedup');
// merchantKey/salt come from the CMS vault (the central admin panel) first; env is a dev fallback.
const PAYU_KEY_ENV = process.env.PAYU_MERCHANT_KEY || '';
const PAYU_SALT_ENV = process.env.PAYU_MERCHANT_SALT || '';
const APP_URL = process.env.PUBLIC_APP_URL || (config.corsOrigins && config.corsOrigins[0]) || 'http://localhost:8080';
// Idempotency + replay protection is now DURABLE + instance-shared via
// public.payment_webhook_events keyed on the (hash-verified) txnid. PayU carries no
// timestamp, so this DB dedup IS the replay guard; the old in-memory Set lost it on restart.

const sha512Hex = (s) => crypto.createHash('sha512').update(String(s), 'utf8').digest('hex');
const orEmpty = (v) => (v == null ? '' : v);
function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}
function parseForm(raw) {
    // Null-prototype accumulator + reject prototype-polluting keys so a crafted
    // form key (e.g. __proto__) in the webhook body cannot pollute Object.prototype.
    const out = Object.create(null);
    String(raw || '').trim().split('&').forEach((pair) => {
        if (!pair) return;
        const i = pair.indexOf('=');
        const k = i >= 0 ? pair.slice(0, i) : pair;
        const v = i >= 0 ? pair.slice(i + 1) : '';
        try {
            const key = decodeURIComponent(k.replace(/\+/g, ' '));
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
            out[key] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch { /* skip malformed pair */ }
    });
    return out;
}
const landing = (outcome) => `${APP_URL.replace(/\/$/, '')}/app/billing/checkout?payu=${outcome}`;

async function payuWebhook(req, res) {
    // Tracks a FRESH idempotency claim so the catch can release it on apply-failure. Without this, a
    // transient error after claiming orphans the row → the provider's retry is deduped → payment captured
    // but never fulfilled. Mirrors controller/internalFulfillController.js.
    let claimedTxnid = null;
    try {
        const payu = await cmsVault.getProvider('payu');
        const PAYU_KEY = (payu && payu.secrets && payu.secrets.merchantKey) || PAYU_KEY_ENV;
        const PAYU_SALT = (payu && payu.secrets && payu.secrets.merchantSalt) || PAYU_SALT_ENV;
        if (!PAYU_KEY || !PAYU_SALT) {
            logger.error('[payu-webhook] no PayU merchant key/salt (vault or env)');
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
        const currency = body.currency ? String(body.currency).toUpperCase() : null;

        // Durable idempotency + replay gate: atomically claim this (hash-verified) txnid. A
        // redelivery / replay / post-restart redelivery loses the INSERT race and no-ops. Throws
        // on DB error → outer catch → 5xx, so a money mutation never proceeds unguarded.
        if (txnid) {
            const claim = await dedup.claimEvent('payu', txnid, { eventType: 'payment', orgId: auth.orgId, amount: amountMajor, currency });
            if (!claim.fresh) {
                return res.redirect(302, landing('success'));
            }
            claimedTxnid = txnid;
        }

        if (planSlug === 'pay-as-you-go') {
            await billingService.purchaseCredit(auth, amountMajor, { ref });
            if (txnid) await dedup.markApplied('payu', txnid, { status: 'applied', orgId: auth.orgId, amount: amountMajor, currency });
            logger.info(`[payu-webhook] credited org=${auth.orgId} amount=${amountMajor} txnid=${txnid}`);
            return res.redirect(302, landing('success'));
        }
        if (!planSlug) {
            logger.warn('[payu-webhook] payer has no subscription to activate');
            return res.redirect(302, landing('error'));
        }
        await billingService.activateSubscription(auth, planSlug, { amount: amountMajor, paymentRef: ref });
        if (txnid) await dedup.markApplied('payu', txnid, { status: 'applied', orgId: auth.orgId, amount: amountMajor, currency });
        logger.info(`[payu-webhook] activated org=${auth.orgId} plan=${planSlug} txnid=${txnid}`);
        return res.redirect(302, landing('success'));
    } catch (e) {
        // Release the (unapplied) claim so PayU's retry can re-fulfill — releaseEvent only deletes rows
        // still applied=FALSE, so it can never undo a completed activation. 500 → PayU re-posts.
        if (claimedTxnid) { try { await dedup.releaseEvent('payu', claimedTxnid); } catch (_) { /* best-effort */ } }
        logger.error('[payu-webhook] handler error:', e.message);
        return res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'internal error' } });
    }
}

module.exports = { payuWebhook };
