'use strict';
/**
 * Payment spine wiring for Global Trade Infrastructure.
 *
 * GTI is the estate's high-value property — trade finance, escrow and financed invoices — so
 * exact money matters most here. RazorpayX sends payout amounts in paise as an integer, and
 * that integer is what gets reported: no conversion to major units and back, and therefore no
 * rounding hop anywhere on this path.
 *
 * Gated by PAYMENT_SPINE=true so it can be enabled per environment during the migration.
 * Disabled, it is a no-op that never touches the database.
 */
const { createPaymentSpine, createPaymentOutboxRelay, sequelizeQueryRunner } = require('@baalvion/payment-consistency');

const SITE_ID = 'gti';

// GTI is granted razorpay and bank_transfer. Card and UPI per-transaction caps make
// bank_transfer (NEFT/RTGS) the rail that actually carries the large tickets.
const PROVIDER_RAIL = {
    razorpay: 'razorpay',
    razorpayx: 'bank_transfer',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    neft: 'bank_transfer',
    rtgs: 'bank_transfer',
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
 * Report a verified, non-rejected settlement onto the spine.
 *
 * Called only after the webhook's own guards have passed (signature, forward transition,
 * amount/currency expectation), so this never re-decides whether the payment is real — it
 * only records what already settled. Never throws to its caller: a spine failure must not
 * turn a genuine settlement into a 500 that RazorpayX retries forever.
 */
async function reportSettlement({ eventType, orderId, parsed, tenantId, buyerOrgId, provider = 'razorpayx' }) {
    if (!isEnabled()) return null;
    if (!parsed || parsed.amountMinor == null || !orderId) return null;

    const common = {
        paymentId: String(orderId),
        provider,
        transactionId: String(parsed.providerId || parsed.idempotencyKey || orderId),
        amountMinor: parsed.amountMinor,
        currency: String(parsed.currency || 'INR').toUpperCase(),
        tenantId: tenantId != null ? String(tenantId) : null,
        orderRef: String(orderId),
        feeMinor: parsed.feeMinor == null ? undefined : parsed.feeMinor,
        // GTI is business-to-business: the payer is the buying organisation, not a person.
        // `buyerOrgId` is this service's own id for that counterparty, so it is a site-scoped
        // key rather than a personal one — which is exactly what the party graph should hold
        // for a company.
        customer: buyerOrgId ? { siteCustomerId: String(buyerOrgId) } : undefined,
    };

    if (eventType === 'payments.transaction.completed' || eventType === 'payments.settlement.processed') {
        return spine().recordCapture(common);
    }
    if (eventType === 'payments.transaction.failed' || eventType === 'payments.transaction.reversed') {
        return spine().recordFailure({ ...common, failureReason: parsed.rawStatus || 'failed' });
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
    const url = process.env.REDIS_URL || '';
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
    stopPaymentRelay, SITE_ID, railFor, isEnabled, reportSettlement, spine };
