'use strict';
/**
 * Payment spine wiring for Baalvion Intelligence (signal.baalvion.com).
 *
 * A 2026-07-12 audit concluded this site had no revenue source. It checked news-service; the
 * billing routes on baalvion-intelligence actually proxy to THIS service, which has charged
 * developer plans through Razorpay all along. The site registry recorded `rails: []` as a result,
 * so those captures were invisible to the cross-estate panel. The registry now grants the rail;
 * this reports the money.
 *
 * The organisation is the tenant — plans are bought per org and the quota upgrade is applied to
 * that org's keys, so a panel keyed only on the site could not attribute a single subscription.
 *
 * Gated by PAYMENT_SPINE=true. Disabled, it is a no-op that never touches the database.
 */
// Required lazily so that with the spine off this file pulls in no PCL code and does no I/O.
const pcl = () => require('@baalvion/payment-consistency');

const SITE_ID = 'signal';

// The only rail this site is granted. An unmapped provider returns undefined and the spine
// refuses the record rather than filing it under a rail the payment did not use.
const PROVIDER_RAIL = { razorpay: 'razorpay' };
const railFor = (provider) => PROVIDER_RAIL[String(provider || '').toLowerCase()];

function isEnabled() {
    return process.env.PAYMENT_SPINE === 'true';
}

let _spine;
function spine() {
    if (_spine) return _spine;
    const { sequelize } = require('../models');
    _spine = pcl().createPaymentSpine({ sequelize, siteId: SITE_ID, railFor });
    _spine.sequelize = sequelize;
    return _spine;
}

/**
 * Report a captured developer-plan payment.
 *
 * Called from handleWebhookEvent, which the controller reaches only after verifying the Razorpay
 * signature — so this records a payment that is already proven, rather than deciding anything.
 * Never throws: the webhook must still 200 so Razorpay stops redelivering an event we accepted.
 */
async function reportPlanPayment(entity, { orgId, planSlug } = {}) {
    if (!isEnabled()) return null;
    if (!entity || !orgId) return null;

    try {
        // Razorpay reports `amount` and `fee` in MINOR units already, so there is no conversion
        // and no float hop. `fee` is its GST-inclusive cut and is absent on an authorization —
        // left absent rather than zeroed, because "no fee" and "fee unknown" differ on a report.
        const amountMinor = entity.amount != null ? Number(entity.amount) : null;
        if (amountMinor == null) return null;

        return await spine().recordCapture({
            paymentId: String(entity.id || entity.order_id),
            provider: 'razorpay',
            transactionId: String(entity.id || entity.order_id),
            amountMinor,
            currency: String(entity.currency || 'INR').toUpperCase(),
            ...(entity.fee == null ? {} : { feeMinor: Number(entity.fee) }),
            tenantId: `org:${orgId}`,
            orderRef: `plan:${planSlug || 'unknown'}:${orgId}`,
            customer: {
                // Razorpay's `entity.email` is what the payer TYPED at checkout, so it is not a
                // verified identity and must not become a party match key on its own. The org id
                // came from the order notes we set server-side, so it is the trustworthy key.
                email: entity.email || null,
                emailVerified: false,
                siteCustomerId: String(orgId),
            },
        });
    } catch (err) {
        console.error(JSON.stringify({ evt: 'signal.spine_report_failed', orgId, msg: err.message }));
        return null;
    }
}

// ── Outbox relay ──────────────────────────────────────────────────────────────
// Each service owns its own `pcl` schema in its own database, so each drains its own outbox.
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
        console.error(JSON.stringify({ evt: 'payment_outbox.start_failed', msg: err.message }));
        _relay = null;
    }
    return _relay;
}

async function stopPaymentRelay() {
    if (_relay) { await _relay.stop().catch(() => {}); _relay = null; }
}

module.exports = { SITE_ID, railFor, isEnabled, spine, reportPlanPayment, startPaymentRelay, stopPaymentRelay };
