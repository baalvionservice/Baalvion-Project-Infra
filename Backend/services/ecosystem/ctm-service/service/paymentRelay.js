'use strict';
/**
 * Payment outbox relay for ControlTheMarket.
 *
 * ctm-service reports payments through `pclShadow`, which writes to this service's own `pcl`
 * schema. Each service keeps that schema in its own database, so each drains its own outbox —
 * without this the payments would be recorded correctly and remain invisible to the
 * cross-estate panel.
 *
 * Gated by PCL_SHADOW (the same flag that turns the reporting on), so the relay never runs
 * where nothing is producing.
 */
const { createPaymentOutboxRelay, sequelizeQueryRunner } = require('@baalvion/payment-consistency');

const relayLog = {
    error: (o, m) => console.error(JSON.stringify({ evt: 'payment_outbox.error', msg: m, ...o })),
    warn: (o, m) => console.warn(JSON.stringify({ evt: 'payment_outbox.warn', msg: m, ...o })),
    info: (o, m) => console.info(JSON.stringify({ evt: 'payment_outbox.relay', msg: m, ...o })),
    debug: () => {},
};

function isEnabled() {
    return process.env.PCL_SHADOW === 'true';
}

function redisClient() {
    const Redis = require('ioredis');
    const url = process.env.REDIS_URL;
    // A blocking relay read must not be cut short by the retry cap.
    const opts = { lazyConnect: true, maxRetriesPerRequest: null };
    return url
        ? new Redis(url, opts)
        : new Redis({ host: process.env.REDIS_HOST || 'redis', port: Number(process.env.REDIS_PORT || 6379), ...opts });
}

let _relay = null;

/** Start draining the payment outbox. Idempotent; a no-op when reporting is off. */
function startPaymentRelay() {
    if (!isEnabled() || _relay) return _relay;
    try {
        const { sequelize } = require('../models');
        _relay = createPaymentOutboxRelay({ pool: sequelizeQueryRunner(sequelize), redis: redisClient(), logger: relayLog });
        _relay.start();
    } catch (err) {
        // Never fatal at boot: the outbox is durable, so a relay that starts late still delivers.
        console.error(JSON.stringify({ evt: 'payment_outbox.start_failed', msg: err.message }));
        _relay = null;
    }
    return _relay;
}

async function stopPaymentRelay() {
    if (_relay) { await _relay.stop().catch(() => {}); _relay = null; }
}

module.exports = { startPaymentRelay, stopPaymentRelay, isEnabled };
