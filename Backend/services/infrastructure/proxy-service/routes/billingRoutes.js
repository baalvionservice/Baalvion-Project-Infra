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
const billingService = require('../service/billingService');
const logger = require('../service/logger');

// Server-authoritative promo codes. The browser's discount display is cosmetic; the ACTUAL
// discount is applied here only for codes in this map (unknown codes → 0% off). The Razorpay
// modal shows the server-computed order amount, so the shopper always sees the true charge.
const PROMOS = { WELCOME10: 0.10, LAUNCH20: 0.20 };
const VALID_INTERVALS = new Set(['monthly', 'yearly']);

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
const GATEWAY_PROVIDERS = ['razorpay', 'stripe', 'payu', 'cashfree'];
const GATEWAY_METHODS = ['CARD', 'UPI', 'NETBANKING', 'BANK'];
// Public app origin — Cashfree orders carry return_url (SPA landing) + notify_url (our webhook).
const PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || 'http://localhost:8080').replace(/\/$/, '');

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
    if (!currency || !idempotencyKey) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'currency and idempotencyKey are required' } });
    }
    try {
        // SECURITY: the charge amount is computed SERVER-SIDE from the plan price — never trusted from
        // the browser (which previously sent `amount` directly). Resolve the plan from the explicit
        // planSlug, else from the caller's own subscription; price by interval; apply only validated
        // promo codes. The client `amount` is used solely to log a tamper attempt.
        const interval = VALID_INTERVALS.has(String(body.interval)) ? String(body.interval) : 'monthly';
        const promoCode = body.promoCode ? String(body.promoCode).trim().toUpperCase() : '';
        let plan = body.planSlug ? await billingService.getPlan(String(body.planSlug)) : null;
        if (!plan) {
            const sub = await billingService.getSubscription(req.auth);
            if (sub && sub.planSlug) plan = await billingService.getPlan(sub.planSlug);
        }
        if (!plan) {
            return res.status(400).json({ error: { code: 'PLAN_REQUIRED', message: 'no resolvable plan for this checkout' } });
        }
        // Pay-As-You-Go is a prepaid CREDIT top-up: the charge is the shopper's chosen amount
        // (range-checked), NOT a fixed monthly price — so we accept the client amount here. Every
        // other plan is a subscription priced SERVER-SIDE from the plan (browser amount ignored).
        const isPayg = String(plan.slug) === 'pay-as-you-go' || Number(plan.monthlyPrice || 0) === 0;
        let serverAmount;
        let expectedMajor;
        if (isPayg) {
            const reqAmount = Number(amount);
            const MIN_TOPUP = 500;       // $5.00 — matches creditService MIN_TOPUP (never charge what the ledger rejects)
            const MAX_TOPUP = 1000000;   // $10,000.00 — matches creditService MAX_TOPUP
            if (!Number.isInteger(reqAmount) || reqAmount < MIN_TOPUP || reqAmount > MAX_TOPUP) {
                return res.status(400).json({ error: { code: 'INVALID_TOPUP', message: 'top-up must be a whole number of minor units between 500 ($5) and 1000000 ($10,000)' } });
            }
            serverAmount = reqAmount;
            expectedMajor = reqAmount / 100;
        } else {
            const unitPrice = Number(plan.monthlyPrice || 0) * (interval === 'yearly' ? 10 : 1);
            const promoRate = promoCode && PROMOS[promoCode] ? PROMOS[promoCode] : 0;
            expectedMajor = Math.max(0, Math.round(unitPrice * (1 - promoRate) * 100) / 100);
            serverAmount = Math.round(expectedMajor * 100); // provider minor units (cents)
            if (serverAmount <= 0) {
                return res.status(400).json({ error: { code: 'NOTHING_TO_CHARGE', message: 'plan price resolves to zero — no payment needed' } });
            }
            if (Number.isInteger(Number(amount)) && Number(amount) !== serverAmount) {
                logger.warn(`[billing] checkout amount override: client=${Number(amount)} server=${serverAmount} org=${req.auth.orgId} plan=${plan.slug} interval=${interval} promo=${promoCode || 'none'}`);
            }
        }
        // payment-service reads the tenant slug from the `site` QUERY PARAM (@RequestParam), not from
        // body.metadata — passing it here selects CMS-vault (per-tenant keys) mode over the global
        // env-key fallback. metadata.websiteSlug is also kept in the body for logging/forward-compat.
        const r = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments?site=${encodeURIComponent(SITE_SLUG)}`, {
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
                amount: serverAmount, // server-computed, not the browser's claim
                currency: String(currency),
                ...(receipt ? { orderRef: String(receipt) } : {}),
                // Stamp the VERIFIED user email (never the browser's) onto the order. PayU echoes it
                // back in its (hash-signed) callback, which is how that redirect flow maps the payment
                // to the tenant; harmless prefill for the other providers.
                customer: { ...(customer || {}), email: req.auth.email },
                // metadata → Razorpay order `notes` (the RazorpayGateway forwards it verbatim). These
                // SERVER-TRUSTED fields (orgId/userId from the verified JWT) let the provider webhook
                // map the payment back to the tenant + plan and activate idempotently. Never from the browser.
                metadata: {
                    websiteSlug: SITE_SLUG,
                    orgId: String(req.auth.orgId || ''),
                    userId: String(req.auth.userId || ''),
                    planSlug: String(plan.slug),
                    interval,
                    amountMajor: expectedMajor.toFixed(2),
                    // The webhook reads this to decide what a captured payment means: a PAYG prepaid
                    // 'credit' top-up vs a 'subscription' activation.
                    kind: isPayg ? 'credit' : 'subscription',
                    // Cashfree order_meta: where to redirect the shopper back (return_url) and where to
                    // POST the S2S webhook (notify_url → our same-origin Cashfree callback).
                    ...(provider === 'cashfree' ? {
                        returnUrl: `${PUBLIC_APP_URL}/app/billing/checkout?cf=success`,
                        notifyUrl: `${PUBLIC_APP_URL}/v1/billing/webhook/cashfree`,
                    } : {}),
                },
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
        // Distinguish a genuine upstream/transport failure from a logic error so we don't mislabel
        // (and so the real cause is logged instead of swallowed).
        logger.error('[billing] checkout failed:', e && e.message);
        const isUpstream = /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network|timeout/i.test(String(e && e.message));
        if (isUpstream) {
            return res.status(502).json({ error: { code: 'PAYMENT_UPSTREAM', message: 'payment-service unreachable' } });
        }
        return res.status(500).json({ error: { code: 'CHECKOUT_ERROR', message: e && e.message ? e.message : 'checkout failed' } });
    }
});

module.exports = router;
