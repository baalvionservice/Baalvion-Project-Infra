'use strict';
/**
 * Payment spine wiring for Law Elite Network.
 *
 * Consultation bookings have been charged through Razorpay here for some time, but the site
 * registry recorded `rails: []` for `law`, so these captures were invisible to the cross-estate
 * panel — money taken and never reported. The registry now grants the rail; this reports it.
 *
 * The lawyer is the tenant, not the site: a booking's fee is earned by an individual practitioner
 * and payouts are settled per lawyer (see service/ledger.js), so a panel that only knew the site
 * could not attribute or pay anyone.
 *
 * Gated by PAYMENT_SPINE=true. Disabled, it is a no-op that never touches the database.
 */
// Required lazily so that with the spine off this file pulls in no PCL code and does no I/O.
const pcl = () => require('@baalvion/payment-consistency');

const SITE_ID = 'law';

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
    // A real Sequelize instance, not a { query } adapter — transactions need a real runner, and
    // the adapter type-checks and then throws on the first live capture.
    _spine = pcl().createPaymentSpine({ sequelize, siteId: SITE_ID, railFor });
    _spine.sequelize = sequelize;
    return _spine;
}

/**
 * Report a settled consultation payment.
 *
 * Called from settleBooking, i.e. only once the payment row already reads 'succeeded' after a
 * verified signature. Never throws to its caller: settleBooking's side-effects are best-effort by
 * contract, and a reporting failure must not fail a payment that already succeeded.
 *
 * `feeMinor` is Razorpay's own cut, taken from the webhook's `entity.fee` where the webhook is the
 * caller. It is GST-inclusive and is absent on an authorization — left absent rather than zeroed,
 * because a zero fee and an unknown fee are different facts on a revenue report.
 */
async function reportBookingPayment(payment, { feeMinor, email, provider } = {}) {
    if (!isEnabled()) return null;
    if (!payment || payment.status !== 'succeeded') return null;

    try {
        const { Money } = require('@baalvion/money');
        // The column is DECIMAL(10,2) in major units; go through the decimal string so the
        // currency's own exponent sets the scale rather than a hardcoded * 100.
        const money = Money.fromDatabaseValue(payment.amount, payment.currency || 'USD');

        return await spine().recordCapture({
            paymentId: String(payment.id),
            provider: String(provider || payment.provider || 'razorpay').toLowerCase(),
            transactionId: String(payment.provider_tx_id || payment.id),
            amountMinor: money.minor,
            currency: money.currency,
            ...(feeMinor == null ? {} : { feeMinor }),
            // The practitioner earns this, not the site.
            tenantId: payment.lawyer_id ? `lawyer:${payment.lawyer_id}` : SITE_ID,
            orderRef: payment.booking_id ? `booking:${payment.booking_id}` : `payment:${payment.id}`,
            customer: {
                // Razorpay's `entity.email` is what the payer TYPED at checkout, so it is not a
                // verified identity and must not become a party match key on its own.
                email: email || null,
                emailVerified: false,
                siteCustomerId: payment.client_id != null ? String(payment.client_id) : null,
            },
        });
    } catch (err) {
        console.error(JSON.stringify({ evt: 'law.spine_report_failed', paymentId: payment.id, msg: err.message }));
        return null;
    }
}

// ── Outbox relay ──────────────────────────────────────────────────────────────
// Each service owns its own `pcl` schema in its own database, so each drains its own outbox.
// Without this, payments record correctly and reach nobody.
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
        // A relay that cannot start must never block boot — the outbox is durable and drains later.
        console.error(JSON.stringify({ evt: 'payment_outbox.start_failed', msg: err.message }));
        _relay = null;
    }
    return _relay;
}

async function stopPaymentRelay() {
    if (_relay) { await _relay.stop().catch(() => {}); _relay = null; }
}

module.exports = { SITE_ID, railFor, isEnabled, spine, reportBookingPayment, startPaymentRelay, stopPaymentRelay };
