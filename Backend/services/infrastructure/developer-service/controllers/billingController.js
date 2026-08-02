'use strict';
const crypto = require('crypto');
const { z } = require('zod');
const razorpayBilling = require('../services/razorpayBillingService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

const planParamSchema = z.object({ plan: z.enum(['starter', 'growth', 'pro']) });

// Public — the marketing site polls this to decide whether to show/hide the launch-offer banner
// and how many spots are left. Real, Redis-backed count (see razorpayBillingService), not decor.
exports.getLaunchOfferStatus = async (req, res) => {
    const remaining = await razorpayBilling.launchOfferRemaining();
    sendSuccess(req, res, { remaining, max: razorpayBilling.LAUNCH_OFFER_MAX });
};

exports.createCheckoutOrder = async (req, res) => {
    const parsed = planParamSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Unknown plan', 422, parsed.error.flatten());

    const orgId = req.auth?.orgId;
    if (!orgId) throw new AppError('FORBIDDEN', 'Account has no organization to bill', 403);

    const order = await razorpayBilling.createCheckoutOrder({
        orgId,
        planSlug: parsed.data.plan,
        customerEmail: req.auth?.email,
    });
    sendSuccess(req, res, order, 201);
};

// Razorpay signs the RAW request body with the webhook secret and sends the hex HMAC in
// X-Razorpay-Signature — mounted with express.raw() in index.js (BEFORE express.json(), which
// would otherwise consume/parse the body first). Same verification approach as
// Backend/services/commerce/order-service/middleware/razorpayWebhookAuth.js. Public (no
// authenticate/requireDeveloper): Razorpay calls this directly, authenticated by signature only.
exports.handleRazorpayWebhook = async (req, res) => {
    if (!config.razorpay.webhookSecret) {
        logger.error('[razorpay-billing] RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook');
        return res.status(401).json({ success: false, error: { code: 'WEBHOOK_NOT_CONFIGURED', message: 'Billing webhooks are disabled' } });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing webhook signature' } });
    }

    const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(req.body).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        logger.warn('[razorpay-billing] signature verification failed');
        return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString('utf8'));
    } catch {
        return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid JSON payload' } });
    }

    try {
        await razorpayBilling.handleWebhookEvent(event);
    } catch (err) {
        // Ack 200 regardless — Razorpay retries non-2xx responses, and a transient failure here
        // (e.g. a key-update race) shouldn't cause runaway retries against an already-charged
        // customer. Logged for manual reconciliation instead of silently swallowed.
        logger.error({ err: err.message, eventType: event.event }, '[razorpay-billing] handler error');
    }

    res.json({ received: true });
};
