'use strict';
/**
 * Elite Circle membership billing — the ONLY payment path for this site.
 *
 * Checkout forwards server-to-server to the JVM payment-service, which owns the merchant
 * credentials and resolves the provider from the CMS vault. No payment logic and no PSP keys
 * live here, and no client-supplied amount is ever trusted: the price is quoted from the tier
 * catalogue plus the caller's own membership row.
 *
 * `/fulfill` is the return leg — payment-service calls it after signature-verifying a CAPTURED
 * provider webhook. That is the only thing that grants a membership.
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const billing = require('../service/billingService');
const { AppError } = require('../utils/errors');

// Tier catalogue + the caller's current membership + a per-tier upgrade quote.
router.get('/tiers', authMiddleware, async (req, res, next) => {
    try {
        return res.json({ success: true, data: await billing.tiersFor(req.auth.userId) });
    } catch (err) { return next(err); }
});

/**
 * Start a checkout. The body names a TIER, never an amount — pricing is server-authoritative,
 * so a tampered client cannot buy an Investor Partner membership for a dollar.
 */
router.post('/checkout', authMiddleware, async (req, res, next) => {
    try {
        const tier = req.body && req.body.tier;
        const data = await billing.startCheckout({
            userId: req.auth.userId,
            email: req.auth.email || null,
            tier,
        });
        return res.json({ success: true, data });
    } catch (err) { return next(err); }
});

/**
 * Internal fulfilment callback from payment-service.
 *
 * Deliberately NOT behind authMiddleware — the caller is a service, not a user. Authenticity is
 * the shared internal secret, compared in constant time.
 *
 * Status contract the JVM depends on: 200 = applied/duplicate (commit, no retry); 400 =
 * permanently malformed (no retry); 503 = transient (roll back so the provider redelivers).
 */
router.post('/fulfill', async (req, res) => {
    if (!billing.secretMatches(req.headers['x-internal-secret'])) {
        return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'internal secret required' });
    }
    const b = req.body || {};
    try {
        const out = await billing.fulfill({
            eventId: b.eventId || b.providerEventId || b.providerRef,
            provider: b.provider,
            metadata: b.metadata,
            amountMinor: b.amountMinor,
            currency: b.currency,
            providerRef: b.providerRef || b.provider_ref,
        });
        return res.status(200).json({ ok: true, ...out, membership: undefined });
    } catch (err) {
        const status = err instanceof AppError ? err.statusCode : 503;
        // 4xx is permanent (the JVM must not retry); anything else is transient.
        return res.status(status >= 400 && status < 500 ? status : 503).json({
            ok: false,
            error: { code: err.code || 'FULFILL_FAILED', message: err.message },
        });
    }
});

module.exports = router;
