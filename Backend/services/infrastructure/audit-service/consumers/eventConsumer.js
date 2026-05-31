'use strict';
// Subscribes to the platform event bus (baalvion:events) and records EVERY event
// as an audit entry — this is how the audit log covers all domains without each
// service integrating directly. At-least-once via consumer groups; unacked entries
// are reclaimed after 30s. (Idempotency: the hash chain tolerates replays as new
// rows; dedup can be layered later via event id.)
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const auditService = require('../services/auditService');

const { stream, consumerGroup, consumerName, batchSize, blockMs } = config.eventBus;
let _running = false;
let _conn = null;

const FAILURE_HINT = /(failed|failure|denied|deny|reuse_detected|incident|anomaly|locked|revoked)/i;
const HIGH_SEV = /(incident|anomaly|reuse_detected|high_risk|impersonation|breach|fraud)/i;

function toAuditEvent(eventType, payload, meta) {
    const outcome = /denied|deny/i.test(eventType) ? 'deny' : (FAILURE_HINT.test(eventType) ? 'failure' : 'success');
    const severity = HIGH_SEV.test(eventType) ? 'high' : (FAILURE_HINT.test(eventType) ? 'medium' : 'info');
    return {
        action:         eventType || 'event',
        actorId:        payload.userId ?? payload.actorId ?? payload.sub ?? null,
        orgId:          payload.orgId ?? payload.org_id ?? null,
        ip:             payload.ipAddress ?? payload.ip ?? null,
        userAgent:      payload.userAgent ?? null,
        resourceType:   payload.resourceType ?? payload.resource_type ?? null,
        resourceId:     payload.resourceId ?? payload.resource_id ?? null,
        tenantId:       payload.tenantId ?? null,
        outcome, severity,
        sourceService:  payload._source ?? meta._source ?? 'event-bus',
        correlationId:  meta._correlationId ?? payload.traceId ?? null,
        occurredAt:     payload.timestamp ?? payload.createdAt ?? undefined,
        metadata:       payload,
    };
}

async function ensureGroup(r) {
    try {
        await r.xadd(stream, 'MAXLEN', '~', '100000', '*', '_type', 'audit_init');
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
    try {
        await auditService.append(toAuditEvent(data._type, payload, data));
        await r.xack(stream, consumerGroup, msgId);
    } catch (err) {
        logger.error({ msgId, type: data._type, err: err.message }, 'audit append failed — will be reclaimed');
        // no ACK → reclaimed after 30s
    }
}

async function reclaimPending(r) {
    try {
        const pending = await r.xautoclaim(stream, consumerGroup, consumerName, 30_000, '0-0', 'COUNT', 20);
        const msgs = pending?.[1] || [];
        for (const m of msgs) await processMessage(r, m);
        if (msgs.length) logger.info({ count: msgs.length }, 'reclaimed pending events');
    } catch (err) { logger.warn({ err: err.message }, 'reclaim failed'); }
}

async function startEventConsumer() {
    if (!config.eventBus.enabled) { logger.info('Event consumer disabled (AUDIT_CONSUME_EVENTS=false)'); return; }
    _conn = redis.newConnection();
    _running = true;
    await ensureGroup(_conn);
    await reclaimPending(_conn);
    logger.info({ stream, consumerGroup, consumerName }, 'Audit event consumer started');

    while (_running) {
        try {
            // Correct XREADGROUP syntax: GROUP <group> <consumer> (no 'CONSUMER' keyword, no 'NOACK false').
            const results = await _conn.xreadgroup(
                'GROUP', consumerGroup, consumerName,
                'COUNT', batchSize,
                'BLOCK', blockMs,
                'STREAMS', stream, '>',
            );
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

module.exports = { startEventConsumer, stopEventConsumer, toAuditEvent };
