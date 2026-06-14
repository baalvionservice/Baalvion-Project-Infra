'use strict';
/**
 * BFF checkout — the ONLY payment path the Proxy-BaalvionStack frontend uses.
 *
 * It does NOT implement payment logic or hold provider keys; it forwards to the
 * SDK-native payment-service server-to-server (internal-auth), which resolves the
 * provider + keys from the CMS vault. The browser receives only PUBLIC client
 * params. This replaces the legacy per-app payment code (paymentController +
 * env-based Razorpay/PayU keys), which is slated for retirement.
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Canonical PSP gateway = Java payment-service (financial-services-java) on host 13015. It exposes
// the same /v1/gateway/* contract as the retired Node twin, so this re-points by host only.
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:13015';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
// Fail-fast: refuse to boot with the committed dev inter-service secret in production
// (matches payment-service/cms-service appConfig guards). A misconfig is caught at deploy,
// not at the first checkout — and never silently authenticates with a publicly-known string.
if (process.env.NODE_ENV === 'production' && (!process.env.INTERNAL_SERVICE_SECRET || INTERNAL_SECRET === 'baalvion-internal-dev-secret')) {
    throw new Error('INTERNAL_SERVICE_SECRET must be set to a non-default value in production');
}
// This backend serves the Proxy site → its vault tenant slug is constant.
const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'proxy-baalvionstack';

// POST /v1/billing/checkout — create a gateway payment intent for an authenticated user.
router.post('/checkout', authMiddleware, async (req, res) => {
    const { amount, currency, idempotencyKey, receipt } = req.body || {};
    if (!(Number(amount) > 0) || !currency || !idempotencyKey) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'amount (minor units), currency, idempotencyKey are required' } });
    }
    try {
        const r = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'proxy-service',
            },
            body: JSON.stringify({ websiteSlug: SITE_SLUG, amount, currency, idempotencyKey, receipt }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return res.status(r.status).json(d);
        const data = d.data || {};
        // Expose ONLY public params to the browser (never keys/secrets).
        return res.json({
            provider: data.provider,
            mode: data.mode,
            orderId: data.providerOrderId,
            amount: data.payment && data.payment.amount,
            currency: data.payment && data.payment.currency,
            clientKey: data.clientParams && (data.clientParams.key || data.clientParams.publishableKey),
            checkoutUrl: data.clientParams && data.clientParams.checkoutUrl,
        });
    } catch (e) {
        return res.status(502).json({ error: { code: 'PAYMENT_UPSTREAM', message: 'payment-service unreachable' } });
    }
});

module.exports = router;
