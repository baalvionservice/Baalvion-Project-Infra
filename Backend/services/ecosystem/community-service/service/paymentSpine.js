'use strict';
/**
 * Payment spine wiring for Baalvion Communities.
 *
 * This service is the reference implementation of the money plane — it holds no PSP keys and
 * relays to payment-service — but that also meant its payments were invisible to the
 * cross-estate panel, because nothing here reported them. This closes that gap.
 *
 * The tenant is the individual paid community, not the site: community.marketunderworld.com
 * hosts many of them, each earning its own money, and a payout to a community owner is
 * impossible if the panel only knows which site it came from.
 *
 * Gated by PAYMENT_SPINE=true. Disabled, it is a no-op that never touches the database.
 */
const { createPaymentSpine, createPaymentOutboxRelay, sequelizeQueryRunner } = require('@baalvion/payment-consistency');

const SITE_ID = 'community';

// Communities are crypto-only, which is the rail the registry grants this site. An unmapped
// provider returns undefined and the spine refuses the record rather than filing it under a
// rail the payment did not use.
const PROVIDER_RAIL = { crypto: 'crypto' };
const railFor = (provider) => PROVIDER_RAIL[String(provider || '').toLowerCase()];

function isEnabled() {
    return process.env.PAYMENT_SPINE === 'true';
}

let _spine;
function spine() {
    if (_spine) return _spine;
    const { sequelize } = require('../models');
    // Sequelize, not a { query } adapter: transactions need a real runner, and the
    // adapter would type-check and then throw on the first capture.
    _spine = createPaymentSpine({ sequelize, siteId: SITE_ID, railFor });
    _spine.sequelize = sequelize;
    return _spine;
}

/**
 * Report a fulfilled community payment.
 *
 * Called only after the fulfilment webhook's own guards have passed (shared-secret verification
 * and the durable idempotency claim), so this records what already completed rather than
 * re-deciding it. Never throws to its caller: a spine failure must not turn a paid membership
 * into a 503 that payment-service retries forever.
 */
async function reportMembershipPayment({ eventId, communitySlug, userId, amountMinor, currency, providerRef, email }) {
    if (!isEnabled()) return null;
    if (amountMinor == null || !communitySlug) return null;

    return spine().recordCapture({
        // The provider's event is the payment's identity here — there is no local order row.
        paymentId: String(providerRef || eventId),
        provider: 'crypto',
        transactionId: String(providerRef || eventId),
        // Already an integer count of minor units on the way in, so nothing is converted.
        amountMinor,
        currency: String(currency || 'USD').toUpperCase(),
        // The earner is the community, not the site.
        tenantId: `community:${communitySlug}`,
        orderRef: `community:${communitySlug}:${userId}`,
        // Who paid, so the party graph can recognise this person on other properties too.
        // The address reached us through payment-service's signed fulfilment callback rather
        // than from a browser form, so it is treated as verified; `userId` is this site's own
        // id for them and is scoped to the site as a match key.
        customer: {
            email: email || null,
            emailVerified: Boolean(email),
            siteCustomerId: userId ? String(userId) : null,
        },
    });
}

// ── Outbox relay ──────────────────────────────────────────────────────────────
// Each service keeps its own `pcl` schema in its own database, so each drains its own outbox.
// Without this the payments recorded above would sit in payment_outbox and never reach the
// cross-estate panel — recorded correctly, and invisible.
let _relay = null;

function redisClient() {
    const Redis = require('ioredis');
    // Loaded here, not at module scope: appConfig calls requireEnv, and importing this module
    // must not demand the full runtime environment (its own tests import it).
    const config = require('../config/appConfig');
    const url = process.env.REDIS_URL || '';
    if (url) return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null });
    return new Redis({
        host: process.env.REDIS_HOST || config.redis && config.redis.host || 'redis',
        port: Number(process.env.REDIS_PORT || config.redis && config.redis.port || 6379),
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

module.exports = {
    startPaymentRelay,
    stopPaymentRelay, SITE_ID, railFor, isEnabled, reportMembershipPayment, spine };
