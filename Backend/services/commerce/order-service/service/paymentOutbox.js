'use strict';
/**
 * Payment outbox relay — the hop that makes every payment visible in one place.
 *
 * The PCL state machine writes a side-effect row into `pcl.payment_outbox` in the SAME
 * transaction as the state change, so an emitted payment can never be lost to a crash or a
 * bus outage. This relay drains those rows, maps each one to the canonical
 * `payment.recorded` event and publishes it to the platform bus, where the cross-estate read
 * model consumes it.
 *
 * Until this existed, PCL's own notes were literally true: it emitted to nobody.
 *
 * Delivery contract (so the relay retries correctly):
 *   - published ok                     → resolve (ack, mark SENT)
 *   - not a payment state change       → resolve (PAYMENT_CONFLICT is an alert, not a record)
 *   - envelope has no siteId           → THROW   (an unattributable payment must not silently
 *                                                 enter the read model; it dead-letters loudly)
 *   - bus failure                      → THROW   (relay backs off and retries)
 */
const Redis = require('ioredis');
const { createPgOutboxStore, startOutboxRelay, relayOutbox, createRedisPublisher } = require('@baalvion/events');
const { paymentRecordedFromEnvelope } = require('@baalvion/payment-consistency');
const config = require('../config/appConfig');
const { makeOutboxRunner } = require('../utils/outboxRunner');

const SCHEMA = 'pcl';
const TABLE = 'payment_outbox';

const relayLog = {
    error: (o, m) => console.error(JSON.stringify({ evt: 'payment_outbox.error', msg: m, ...o })),
    warn:  (o, m) => console.warn(JSON.stringify({ evt: 'payment_outbox.warn', msg: m, ...o })),
    info:  (o, m) => console.info(JSON.stringify({ evt: 'payment_outbox.relay', msg: m, ...o })),
    debug: () => {},
};

const store = createPgOutboxStore({ runner: makeOutboxRunner(), schema: SCHEMA, table: TABLE });

let redisClient = null;
function getRedis() {
    if (redisClient) return redisClient;
    redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
    });
    redisClient.on('error', (err) => relayLog.warn({ msg: err.message }, 'redis error'));
    return redisClient;
}

/**
 * Adapts the outbox relay to the bus. `rethrow: true` is required here — the relay has to
 * observe a publish failure to retry it, otherwise a bus outage silently drops payments.
 */
function createPaymentPublisher(bus = null) {
    const publisher = bus || createRedisPublisher(getRedis(), relayLog, { rethrow: true });
    return {
        async publish(event) {
            // The relay hands back the stored envelope; `payload` is the PCL OutboxEnvelope.
            const envelope = (event && event.payload) || event;
            const recorded = paymentRecordedFromEnvelope(envelope);
            if (!recorded) {
                relayLog.info({ id: envelope && envelope.id, type: envelope && envelope.type }, 'not a payment state change — acked without publishing');
                return;
            }
            await publisher.publish(recorded);
        },
        async publishMany(events) {
            for (const e of events) await this.publish(e);
        },
    };
}

let handle = null;
let publisher = null;

/** Start the background relay (idempotent — repeated calls return the same handle). */
function startPaymentOutboxRelay(opts = {}) {
    if (handle) return handle;
    publisher = publisher || createPaymentPublisher(opts.bus);
    handle = startOutboxRelay(store, publisher, relayLog, { pollMs: 2000, ...opts });
    console.info(JSON.stringify({ evt: 'payment_outbox.started', pollMs: opts.pollMs || 2000 }));
    return handle;
}

async function stopPaymentOutboxRelay() {
    if (handle) { await handle.stop(); handle = null; }
    if (redisClient) { await redisClient.quit().catch(() => {}); redisClient = null; }
}

/** Drain one batch synchronously (used by tests / manual triggers). */
function drainOnce(opts = {}) {
    return relayOutbox(store, publisher || createPaymentPublisher(opts.bus), relayLog, opts);
}

module.exports = {
    store,
    createPaymentPublisher,
    startPaymentOutboxRelay,
    stopPaymentOutboxRelay,
    drainOnce,
};
