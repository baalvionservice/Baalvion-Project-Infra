'use strict';
/**
 * BFF checkout for Baalvion Elite Circle — the ONLY payment path the frontend uses.
 * Forwards to the SDK-native payment-service server-to-server (internal-auth), which
 * resolves provider + keys from the CMS vault. No payment logic / keys live here.
 * Mirrors proxy-service/routes/billingRoutes.js (slug = baalvion-elite-circle).
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3915';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
// Fail-fast: refuse to boot with the committed dev inter-service secret in production
// (matches payment-service/cms-service appConfig guards). A misconfig is caught at deploy,
// not at the first checkout — and never silently authenticates with a publicly-known string.
if (process.env.NODE_ENV === 'production' && (!process.env.INTERNAL_SERVICE_SECRET || INTERNAL_SECRET === 'baalvion-internal-dev-secret')) {
    throw new Error('INTERNAL_SERVICE_SECRET must be set to a non-default value in production');
}
const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'baalvion-elite-circle';

router.post('/checkout', authMiddleware, async (req, res) => {
    const { amount, currency, idempotencyKey, receipt } = req.body || {};
    if (!(Number(amount) > 0) || !currency || !idempotencyKey) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'amount (minor units), currency, idempotencyKey are required' } });
    }
    try {
        const r = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': 'insiders-service' },
            body: JSON.stringify({ websiteSlug: SITE_SLUG, amount, currency, idempotencyKey, receipt }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return res.status(r.status).json(d);
        const data = d.data || {};
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
