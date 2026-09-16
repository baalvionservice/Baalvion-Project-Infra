'use strict';
/**
 * Payment spine wiring for the gift-card storefront.
 *
 * Gift cards are sold on community.marketunderworld.com, so they belong to the `community`
 * site; the tenant is the individual brand, which is what a per-brand settlement or margin
 * question needs. Like community-service, this service holds no PSP keys — it relays to
 * payment-service — which is exactly why its payments were invisible to the cross-estate panel
 * until now.
 *
 * Gated by PAYMENT_SPINE=true. Disabled, it is a no-op that never touches the database.
 */
const { createPaymentSpine, createPaymentOutboxRelay, sequelizeQueryRunner } = require('@baalvion/payment-consistency');

const SITE_ID = 'community';

// Crypto for a fresh charge; a wallet purchase is settled from a balance the customer already
// funded, so it is recorded on the rail that originally brought the money in.
const PROVIDER_RAIL = { crypto: 'crypto', wallet: 'crypto' };
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
 * Report a paid gift-card order.
 *
 * Called after the fulfilment webhook's guards have passed, so it records what already
 * completed. Never throws to its caller: the payment WAS captured, and a spine failure must not
 * make payment-service re-deliver a fulfilled order forever.
 */
async function reportOrderPayment({ orderId, brandSlug, amountMinor, currency, providerRef, provider = 'crypto', userId, email }) {
    if (!isEnabled()) return null;
    if (amountMinor == null || !orderId) return null;

    return spine().recordCapture({
        paymentId: String(providerRef || orderId),
        provider,
        transactionId: String(providerRef || orderId),
        amountMinor,
        currency: String(currency || 'USD').toUpperCase(),
        tenantId: brandSlug ? `giftcard:${brandSlug}` : null,
        orderRef: `giftcard:${orderId}${userId ? `:${userId}` : ''}`,
        // Who paid. Without this the buyer is invisible to the party graph: `userId` inside
        // `orderRef` is an opaque string to the panel, not a match key, so gift-card payments
        // would land with no customer and never join up with the same person on another site.
        // The address arrives through payment-service's signed fulfilment callback rather than
        // a browser form, so it is treated as verified; nothing is invented when it is absent.
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
    stopPaymentRelay, SITE_ID, railFor, isEnabled, reportOrderPayment, spine };
