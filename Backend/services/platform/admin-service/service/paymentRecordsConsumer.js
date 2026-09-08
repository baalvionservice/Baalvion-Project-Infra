'use strict';
/**
 * Consumes `payment.recorded` from the platform event stream into the cross-estate read model.
 *
 * Reads from the Redis stream (`baalvion:event_stream`) via a consumer group rather than
 * pub/sub, because pub/sub drops anything published while this service is down and a dropped
 * payment is invisible forever. A consumer group holds unacknowledged entries until they are
 * acked, so a restart resumes instead of losing money records.
 *
 * The upsert is idempotent and only advances a payment up the ladder, so redelivery after a
 * crash is safe by construction — no dedupe table needed on this side.
 */
const Redis = require('ioredis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const records = require('./paymentRecordsService');

const STREAM_KEY = 'baalvion:event_stream';
const GROUP = 'admin-payment-records';
const CONSUMER = `admin-${process.pid}`;
const BLOCK_MS = 5000;
const BATCH = 50;
/** How long an unacknowledged entry sits before another consumer may reclaim it. */
const RECLAIM_IDLE_MS = 60_000;
/**
 * After this many deliveries an entry is treated as poison: acknowledged so it stops being
 * redelivered forever, and logged loudly so a person can look at it. Leaving it pending
 * indefinitely is not "safe" — it is an invisible backlog nobody is watching.
 */
const MAX_DELIVERIES = 5;

let client = null;
let running = false;
let loop = null;

function getClient() {
    if (client) return client;
    client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: null, // a blocking read must not be aborted by the retry cap
    });
    client.on('error', (err) => logger.warn({ err: err.message }, '[payment-consumer] redis error'));
    return client;
}

async function ensureGroup(redis) {
    try {
        // MKSTREAM so the group can be created before any producer has published.
        await redis.xgroup('CREATE', STREAM_KEY, GROUP, '0', 'MKSTREAM');
        logger.info({ group: GROUP }, '[payment-consumer] consumer group created');
    } catch (err) {
        if (!String(err.message || '').includes('BUSYGROUP')) throw err;
    }
}

/** Parse one stream entry's field array into the event. Returns null if it is not ours. */
function parseEntry(fields) {
    const map = {};
    for (let i = 0; i < fields.length; i += 2) map[fields[i]] = fields[i + 1];
    if (map.type !== 'payment.recorded') return null;
    try {
        return JSON.parse(map.payload);
    } catch {
        return null;
    }
}

async function handleEntries(redis, entries) {
    for (const [id, fields] of entries) {
        const event = parseEntry(fields);
        if (!event) {
            await redis.xack(STREAM_KEY, GROUP, id); // not a payment event — ack and move on
            continue;
        }
        try {
            const { changed } = await records.applyPaymentRecorded(event);
            await redis.xack(STREAM_KEY, GROUP, id);
            if (changed) {
                logger.info({ paymentId: event.payload.paymentId, siteId: event.payload.siteId, state: event.payload.state }, '[payment-consumer] recorded');
            }
        } catch (err) {
            // A transient failure (database blip) should be retried; a permanently bad event
            // should not be retried forever. The delivery count separates the two.
            const deliveries = await deliveryCount(redis, id);
            if (deliveries >= MAX_DELIVERIES) {
                await redis.xack(STREAM_KEY, GROUP, id);
                logger.error(
                    { err: err.message, code: err.code, entryId: id, deliveries, paymentId: event.payload && event.payload.paymentId },
                    '[payment-consumer] POISON EVENT — acknowledged after repeated failures so it stops blocking; this payment is NOT in the read model and needs a person',
                );
            } else {
                logger.error({ err: err.message, code: err.code, entryId: id, deliveries }, '[payment-consumer] apply failed — will be retried');
            }
        }
    }
}

/** How many times this entry has been delivered. Redis tracks it per pending entry. */
async function deliveryCount(redis, id) {
    try {
        const pending = await redis.xpending(STREAM_KEY, GROUP, id, id, 1);
        // [[id, consumer, idleMs, deliveryCount]]
        return Array.isArray(pending) && pending[0] ? Number(pending[0][3]) || 1 : 1;
    } catch {
        return 1;
    }
}

/**
 * Reclaim entries a previous process left unacknowledged.
 *
 * Without this a crash mid-batch strands those payments: they stay pending under a consumer
 * name that no longer exists, and `>` only ever returns entries nobody has seen. XAUTOCLAIM
 * hands them to a live consumer so the retry actually happens.
 */
async function reclaimStale(redis) {
    try {
        const res = await redis.xautoclaim(STREAM_KEY, GROUP, CONSUMER, RECLAIM_IDLE_MS, '0', 'COUNT', BATCH);
        const entries = Array.isArray(res) ? res[1] : null;
        if (Array.isArray(entries) && entries.length > 0) {
            logger.warn({ count: entries.length }, '[payment-consumer] reclaimed entries a previous process left pending');
            await handleEntries(redis, entries);
        }
    } catch (err) {
        // XAUTOCLAIM needs Redis 6.2+. An older server simply skips the reclaim rather than
        // stopping the consumer.
        logger.debug?.({ err: err.message }, '[payment-consumer] reclaim unavailable');
    }
}

async function pump() {
    const redis = getClient();
    while (running) {
        try {
            await reclaimStale(redis);
            const res = await redis.xreadgroup(
                'GROUP', GROUP, CONSUMER,
                'COUNT', BATCH,
                'BLOCK', BLOCK_MS,
                'STREAMS', STREAM_KEY, '>',
            );
            if (!res) continue; // block timed out with nothing new
            for (const [, entries] of res) await handleEntries(redis, entries);
        } catch (err) {
            if (!running) break;
            logger.error({ err: err.message }, '[payment-consumer] read failed; backing off');
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
}

async function startPaymentRecordsConsumer() {
    if (running) return;
    const redis = getClient();
    await redis.connect().catch(() => {});
    await records.ensureSchema();
    await ensureGroup(redis);
    running = true;
    loop = pump();
    logger.info({ stream: STREAM_KEY, group: GROUP }, '[payment-consumer] started');
}

async function stopPaymentRecordsConsumer() {
    running = false;
    if (loop) { await loop.catch(() => {}); loop = null; }
    if (client) { await client.quit().catch(() => {}); client = null; }
}

module.exports = { startPaymentRecordsConsumer, stopPaymentRecordsConsumer, parseEntry, GROUP, STREAM_KEY };
