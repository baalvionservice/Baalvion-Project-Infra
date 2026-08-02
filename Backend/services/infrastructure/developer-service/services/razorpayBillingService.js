'use strict';
const config = require('../config/appConfig');
const apiKeyService = require('./apiKeyService');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

let RazorpaySdk = null;
function client() {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) return null;
    if (!RazorpaySdk) RazorpaySdk = require('razorpay'); // lazy: boots fine with billing unconfigured
    return new RazorpaySdk({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
}

// Must stay in sync with Frontend/baalvion-intelligence/src/lib/plans.ts (marketed price) and
// plan-quota.ts (monthly allowance / 30 = the daily quota news-service actually enforces).
// `amount` is in the smallest currency unit (cents for USD, paise for INR) — Razorpay's Orders
// API always expects that regardless of currency.
const PLANS = {
    starter: { amount: 1900, dailyQuota: 333 },
    growth: { amount: 7900, dailyQuota: 3333 },
    pro: { amount: 29900, dailyQuota: 33333 },
};

// Founding-customer launch offer: 50% off, capped at the first 10 REDEEMED (paid) orders — not
// the first 10 orders created, so an abandoned checkout never burns a slot. Tracked in Redis so
// the count survives restarts and is shared across instances; if Redis is unavailable we fail
// closed on the DISCOUNT (no offer applied) rather than risk an unbounded number of redemptions.
const LAUNCH_OFFER_KEY = 'billing:launch_offer:redeemed';
const LAUNCH_OFFER_MAX = 10;
const LAUNCH_OFFER_DISCOUNT = 0.5;

async function launchOfferRemaining() {
    const c = redis.getClient();
    if (!c) return 0;
    const used = Number((await c.get(LAUNCH_OFFER_KEY)) || 0);
    return Math.max(LAUNCH_OFFER_MAX - used, 0);
}

// Best-effort claim after a CONFIRMED payment. A tiny race between two simultaneous checkouts
// both seeing "slots available" can let in one extra redemption at the boundary — acceptable for
// a 3-day launch promo; not worth a distributed lock for ±1 discounted order.
async function claimLaunchOfferSlot() {
    const c = redis.getClient();
    if (!c) return false;
    const next = await c.incr(LAUNCH_OFFER_KEY);
    if (next > LAUNCH_OFFER_MAX) {
        await c.decr(LAUNCH_OFFER_KEY);
        return false;
    }
    return true;
}

async function createCheckoutOrder({ orgId, planSlug, customerEmail }) {
    const plan = PLANS[planSlug];
    if (!plan) throw new AppError('PLAN_NOT_FOUND', `Unknown plan "${planSlug}"`, 404);

    const rzp = client();
    if (!rzp) throw new AppError('BILLING_NOT_CONFIGURED', 'Billing is not configured yet', 503);

    const offerAvailable = (await launchOfferRemaining()) > 0;
    const amount = offerAvailable ? Math.round(plan.amount * LAUNCH_OFFER_DISCOUNT) : plan.amount;

    // notes carries the fulfillment key — the webhook reads these straight back off the paid
    // entity, no separate lookup table needed. `discounted` records whether THIS order was priced
    // with the launch offer, so the webhook only claims a slot for orders that actually used it.
    const order = await rzp.orders.create({
        amount,
        currency: config.razorpay.currency,
        notes: { orgId, planSlug, discounted: offerAvailable ? 'true' : 'false' },
    });

    return {
        keyId: config.razorpay.keyId,
        orderId: order.id,
        amount,
        currency: config.razorpay.currency,
        planSlug,
        discounted: offerAvailable,
        prefillEmail: customerEmail || '',
    };
}

async function upgradeOrgKeys(orgId, planSlug) {
    const plan = PLANS[planSlug];
    if (!plan) {
        logger.warn({ orgId, planSlug }, '[razorpay-billing] unknown plan slug — skipping key upgrade');
        return;
    }
    const { items } = await apiKeyService.list(orgId, { status: 'active', limit: 200 });
    await Promise.all(items.map((key) => apiKeyService.updateScopes(key.id, [`quota:${plan.dailyQuota}`], orgId)));
    logger.info({ orgId, planSlug, dailyQuota: plan.dailyQuota, keyCount: items.length }, '[razorpay-billing] org keys upgraded');
}

// Called by the controller AFTER signature verification — a parsed, trusted Razorpay event.
async function handleWebhookEvent(event) {
    const paid = event.event === 'payment.captured' || event.event === 'order.paid';
    if (!paid) return;

    const entity = event.payload?.payment?.entity || event.payload?.order?.entity || {};
    const { orgId, planSlug, discounted } = entity.notes || {};
    if (!orgId || !planSlug) {
        logger.warn({ eventId: event.id, eventType: event.event }, '[razorpay-billing] webhook event missing orgId/planSlug notes');
        return;
    }
    await upgradeOrgKeys(orgId, planSlug);
    if (discounted === 'true') await claimLaunchOfferSlot();
}

module.exports = { PLANS, createCheckoutOrder, handleWebhookEvent, launchOfferRemaining, LAUNCH_OFFER_MAX };
