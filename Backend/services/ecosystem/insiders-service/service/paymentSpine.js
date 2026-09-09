'use strict';
/**
 * Payment spine wiring for Baalvion Insiders (marketunderworld.com).
 *
 * Like community-service, this service holds no PSP keys — it relays to payment-service and is
 * told the outcome through a signed fulfilment callback. That is also why its memberships were
 * invisible to the cross-estate panel: nothing here reported them.
 *
 * The site IS the tenant here. Unlike communities (many earners on one host) or gift cards
 * (per brand), Insiders sells one product — Elite Circle membership — on its own account, so a
 * per-tier tenant would invent a split that does not exist in the business.
 *
 * Gated by PAYMENT_SPINE=true. Disabled, it is a no-op that never touches the database.
 */
// Required lazily, not at module scope: with the spine off this file must be a cheap no-op that
// pulls in no PCL code and touches no database — and billingService imports it unconditionally.
const pcl = () => require('@baalvion/payment-consistency');

const SITE_ID = 'insiders';

// Which rail a payment-service provider settles on. An unmapped provider returns undefined and
// the spine refuses the record rather than filing it under a rail the payment did not use —
// never substitute a rail the site merely happens to hold.
const PROVIDER_RAIL = {
    razorpay: 'razorpay',
    payu: 'payu',
    cashfree: 'cashfree',
    crypto: 'crypto',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
};
const railFor = (provider) => PROVIDER_RAIL[String(provider || '').toLowerCase()];

function isEnabled() {
    return process.env.PAYMENT_SPINE === 'true';
}

let _spine;
function spine() {
    if (_spine) return _spine;
    const { sequelize } = require('../models');
    // Sequelize, not a hand-rolled { query } adapter: transactions need a real runner, and the
    // adapter type-checks and then throws on the first real capture.
    _spine = pcl().createPaymentSpine({ sequelize, siteId: SITE_ID, railFor });
    _spine.sequelize = sequelize;
    return _spine;
}

/**
 * Report a fulfilled membership payment.
 *
 * Called only after the fulfilment callback's own guards have passed (shared-secret check and
 * the durable idempotency claim), so this records what already completed rather than
 * re-deciding it. Never throws to its caller: a spine failure must not turn a paid membership
 * into a 503 that payment-service then retries forever.
 */
async function reportMembershipPayment({ eventId, provider, userId, tier, amountMinor, currency, providerRef, email }) {
    if (!isEnabled()) return null;
    if (amountMinor == null || !userId) return null;

    return spine().recordCapture({
        // The provider's event is the payment's identity — the local row is keyed by it too.
        paymentId: String(providerRef || eventId),
        provider: String(provider || 'gateway').toLowerCase(),
        transactionId: String(providerRef || eventId),
        // Already an integer count of minor units on the way in, so nothing is converted.
        amountMinor,
        currency: String(currency || 'USD').toUpperCase(),
        tenantId: SITE_ID,
        orderRef: `insiders:${tier || 'membership'}:${userId}`,
        // Who paid, so the party graph recognises this person on the other properties too. The
        // address arrived through payment-service's signed callback rather than a browser form,
        // so it is treated as verified; `userId` is this site's own id for them.
        customer: {
            email: email || null,
            emailVerified: Boolean(email),
            siteCustomerId: String(userId),
        },
    });
}

// ── Outbox relay ──────────────────────────────────────────────────────────────
// Each service keeps its own `pcl` schema in its own database, so each drains its own outbox.
// Without this the payments recorded above sit in payment_outbox forever — recorded correctly,
// and invisible to the panel.
let _relay = null;

function redisClient() {
    const Redis = require('ioredis');
    const url = process.env.REDIS_URL || '';
    if (url) return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null });
    return new Redis({
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT || 6379),
        lazyConnect: true,
        maxRetriesPerRequest: null,
    });
}

const relayLog = {
    error: (o, m) => console.error(JSON.stringify({ evt: 'payment_outbox.error', msg: m, ...o })),
    warn: (o, m) => console.warn(JSON.stringify({ evt: 'payment_outbox.warn', msg: m, ...o })),
    info: (o, m) => console.info(JSON.stringify({ evt: 'payment_outbox.relay', msg: m, ...o })),
    debug: () => {},
};

/** Start draining this service's payment outbox. Idempotent; a no-op when the spine is off. */
function startPaymentRelay() {
    if (!isEnabled() || _relay) return _relay;
    try {
        const { createPaymentOutboxRelay, sequelizeQueryRunner } = pcl();
        _relay = createPaymentOutboxRelay({ pool: sequelizeQueryRunner(spine().sequelize), redis: redisClient(), logger: relayLog });
        _relay.start();
    } catch (err) {
        // A relay that cannot start must not stop the service booting — payments still record
        // locally and drain once it is fixed, because the outbox is durable.
        console.error(JSON.stringify({ evt: 'payment_outbox.start_failed', msg: err.message }));
        _relay = null;
    }
    return _relay;
}

async function stopPaymentRelay() {
    if (_relay) { await _relay.stop().catch(() => {}); _relay = null; }
}

module.exports = { SITE_ID, railFor, isEnabled, spine, reportMembershipPayment, startPaymentRelay, stopPaymentRelay };
