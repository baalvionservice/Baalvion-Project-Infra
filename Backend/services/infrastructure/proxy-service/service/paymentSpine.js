'use strict';
/**
 * Payment spine wiring for Proxy BaalvionStack.
 *
 * Reports every payment this property takes onto the platform spine, so it appears on the
 * cross-estate admin panel attributed to `proxy` and to the org that paid. All the validation
 * (registered site, granted rail, exact integer money, idempotent transition) lives in
 * @baalvion/payment-consistency — this file is only the wiring and the provider mapping.
 *
 * Gated by PAYMENT_SPINE=true so it can be switched on per environment while the estate is
 * migrated. Disabled, it is a cheap no-op that never touches the database.
 */
const { createPaymentSpine, createPaymentOutboxRelay, sequelizeQueryRunner } = require('@baalvion/payment-consistency');
const config = require('../config/appConfig');
const { Money } = require('@baalvion/money');

const SITE_ID = 'proxy';

// This service's gateway names, mapped to the platform rail vocabulary. An unmapped provider
// returns undefined and the spine refuses the record rather than filing it under a rail the
// payment did not use.
const PROVIDER_RAIL = {
    razorpay: 'razorpay',
    payu: 'payu',
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
    // Sequelize, not a { query } adapter: transactions need a real runner, and the
    // adapter would type-check and then throw on the first capture.
    _spine = createPaymentSpine({ sequelize, siteId: SITE_ID, railFor });
    _spine.sequelize = sequelize;
    return _spine;
}

/**
 * Translate a verified Razorpay webhook into a spine report.
 *
 * Razorpay sends the amount in paise as an integer, which is already the platform's money
 * representation — no conversion, and therefore no rounding, happens anywhere on this path.
 * Returns null for events that are not a payment state change.
 */
async function reportRazorpayEvent(event, payload) {
    if (!isEnabled()) return null;
    const entity = (payload && payload.payment && payload.payment.entity) || null;
    if (!entity) return null;

    const common = {
        paymentId: String(entity.order_id || entity.id),
        provider: 'razorpay',
        transactionId: String(entity.id),
        amountMinor: Money.of(entity.amount, entity.currency || 'INR').minor,
        currency: String(entity.currency || 'INR').toUpperCase(),
        // Razorpay reports its cut in paise on the payment entity, already inclusive of GST.
        // Absent on an authorization (the fee is only known once captured), and left undefined
        // there rather than zero — an unknown fee must not read as "no fee".
        feeMinor: entity.fee == null ? null : Number(entity.fee),
        tenantId: entity.notes && entity.notes.orgId ? String(entity.notes.orgId) : null,
        orderRef: entity.order_id ? String(entity.order_id) : null,
        // Who paid. The email is what the payer typed at Razorpay's checkout, so it travels
        // UNVERIFIED and can never merge two people on its own; the org is this service's own
        // id for the account and is a site-scoped key.
        customer: (entity.email || (entity.notes && entity.notes.orgId))
            ? {
                email: entity.email || null,
                emailVerified: false,
                siteCustomerId: entity.notes && entity.notes.orgId ? String(entity.notes.orgId) : null,
            }
            : undefined,
        occurredAt: entity.created_at ? new Date(entity.created_at * 1000) : undefined,
    };

    if (event === 'payment.captured') return spine().recordCapture(common);
    if (event === 'payment.authorized') return spine().recordAuthorization(common);
    if (event === 'payment.failed') {
        return spine().recordFailure({
            ...common,
            failureReason: entity.error_reason || entity.error_code || 'declined',
        });
    }
    return null;
}

// ── Outbox relay ──────────────────────────────────────────────────────────────
// Each service keeps its own `pcl` schema in its own database, so each drains its own outbox.
// Without this the payments recorded above would sit in payment_outbox and never reach the
// cross-estate panel — recorded correctly, and invisible.
let _relay = null;

function redisClient() {
    const Redis = require('ioredis');
    const url = process.env.REDIS_URL || config.redis && config.redis.url;
    if (url) return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null });
    return new Redis({
        host: process.env.REDIS_HOST || '' || 'redis',
        port: Number(process.env.REDIS_PORT || 0 || 6379),
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
    stopPaymentRelay, SITE_ID, railFor, isEnabled, reportRazorpayEvent, spine };
