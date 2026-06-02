'use strict';
// Bridges the platform event bus (baalvion:events) to webhook subscribers: every
// domain event is fanned out as queued deliveries to endpoints subscribed to that
// event type. At-least-once via a consumer group; unacked entries reclaimed after 30s.

const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const webhookService = require('../services/webhookService');

const { stream, consumerGroup, consumerName, batchSize, blockMs } = config.eventBus;
let _running = false;
let _conn = null;

async function ensureGroup(r) {
    try {
        await r.xgroup('CREATE', stream, consumerGroup, '$', 'MKSTREAM');
    } catch (err) {
        if (!String(err.message).includes('BUSYGROUP')) throw err;
    }
}

async function processMessage(r, msg) {
    const [msgId, fields] = msg;
    const data = {};
    for (let i = 0; i < fields.length; i += 2) data[fields[i]] = fields[i + 1];
    let payload = {};
    try { payload = JSON.parse(data._payload || '{}'); } catch { /* keep {} */ }
    const eventType = data._type;
    try {
        if (eventType && eventType !== 'audit_init') {
            await webhookService.dispatch({ orgId: payload.orgId ?? payload.org_id ?? null, eventType, payload });
        }
        await r.xack(stream, consumerGroup, msgId);
    } catch (err) {
        logger.error({ msgId, type: eventType, err: err.message }, 'webhook fan-out failed — will be reclaimed');
    }
}

async function reclaimPending(r) {
    try {
        const pending = await r.xautoclaim(stream, consumerGroup, consumerName, 30_000, '0-0', 'COUNT', 20);
        const msgs = pending?.[1] || [];
        for (const m of msgs) await processMessage(r, m);
    } catch (err) { logger.warn({ err: err.message }, 'reclaim failed'); }
}

async function startEventConsumer() {
    if (!config.eventBus.consume) { logger.info('[developer-service] event consumer disabled'); return; }
    _conn = redis.newConnection();
    _running = true;
    await ensureGroup(_conn);
    await reclaimPending(_conn);
    logger.info({ stream, consumerGroup, consumerName }, '[developer-service] webhook event consumer started');

    while (_running) {
        try {
            const results = await _conn.xreadgroup('GROUP', consumerGroup, consumerName, 'COUNT', batchSize, 'BLOCK', blockMs, 'STREAMS', stream, '>');
            if (!results) continue;
            for (const [, messages] of results) for (const msg of messages) await processMessage(_conn, msg);
        } catch (err) {
            if (!_running) break;
            logger.error({ err: err.message }, 'event consumer loop error — retry in 5s');
            await new Promise((r) => setTimeout(r, 5_000));
        }
    }
}

async function stopEventConsumer() {
    _running = false;
    if (_conn) { _conn.disconnect(); _conn = null; }
}

module.exports = { startEventConsumer, stopEventConsumer };
