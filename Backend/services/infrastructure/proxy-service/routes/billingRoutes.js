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
// The shopper picks the gateway + method in the UI; we forward them to the SDK-native payment-service
// (which holds the keys + resolves the per-tenant vault). Contract (payment-service /v1/gateway/payments):
//   header  Idempotency-Key: <key>   (REQUIRED — dedups a double-click/retry)
//   body    { provider, method, amount(integer minor units), currency, orderRef?, customer?, metadata? }
const GATEWAY_PROVIDERS = ['razorpay', 'stripe', 'payu'];
const GATEWAY_METHODS = ['CARD', 'UPI', 'NETBANKING', 'BANK'];

router.post('/checkout', authMiddleware, async (req, res) => {
    const body = req.body || {};
    const provider = String(body.provider || '').toLowerCase();
    const method = String(body.method || '').toUpperCase();
    const { amount, currency, idempotencyKey, receipt, customer } = body;
    if (!GATEWAY_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'provider must be razorpay, stripe, or payu' } });
    }
    if (!GATEWAY_METHODS.includes(method)) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'method must be CARD, UPI, NETBANKING, or BANK' } });
    }
    if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'amount must be a positive whole number in minor units' } });
    }
    if (!currency || !idempotencyKey) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'currency and idempotencyKey are required' } });
    }
    try {
        const r = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'proxy-service',
                'Idempotency-Key': String(idempotencyKey),
            },
            body: JSON.stringify({
                provider,
                method,
                amount: Number(amount),
                currency: String(currency),
                ...(receipt ? { orderRef: String(receipt) } : {}),
                ...(customer ? { customer } : {}),
                metadata: { websiteSlug: SITE_SLUG },
            }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return res.status(r.status).json(d);
        const data = d.data || d;
        const cp = data.clientParams || {};
        // Expose ONLY public params to the browser (never keys/secrets). clientParams carries exactly
        // what each provider's hosted flow needs (Razorpay key+orderId; PayU form fields incl. hash;
        // Stripe publishable key / checkout url) — it is provider-public by construction.
        return res.json({
            provider: data.provider,
            // mock create ids embed 'mock'; anything else is a real provider order.
            mode: /mock/i.test(String(data.providerRef || '')) ? 'mock' : 'live',
            orderId: data.providerRef,
            status: data.status,
            amount: data.amount,
            currency: data.currency,
            method: data.method,
            clientKey: cp.key || cp.publishableKey || null,
            checkoutUrl: cp.checkoutUrl || null,
            clientParams: cp,
        });
    } catch (e) {
        return res.status(502).json({ error: { code: 'PAYMENT_UPSTREAM', message: 'payment-service unreachable' } });
    }
});

module.exports = router;
