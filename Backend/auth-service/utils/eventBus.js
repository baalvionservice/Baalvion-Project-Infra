'use strict';
/**
 * Thin Redis Streams publisher for the Baalvion event bus.
 *
 * All publishes are fire-and-forget — a failure here never propagates to the
 * caller, ensuring the event bus is never on the critical auth path.
 *
 * Consumers: notification-service (eventConsumer.js), session-service.
 * Stream key: baalvion:events  (configurable via appConfig.eventBus.stream)
 * Format: XADD baalvion:events * type <t> version <v> correlationId <c> data <json> timestamp <iso>
 */

const { v4: uuidv4 } = require('uuid');
const redis          = require('../config/redis');
const config         = require('../config/appConfig');

const STREAM = (config.eventBus && config.eventBus.stream) || 'baalvion:events';

/**
 * Publish a single event to the Redis Stream.
 *
 * @param {string} type          - Dot-namespaced event type, e.g. 'auth.registered'
 * @param {object} data          - Event payload (must be JSON-serialisable)
 * @param {object} [opts]
 * @param {string} [opts.correlationId] - Trace correlation ID (forwarded from request)
 * @param {string} [opts.version]       - Schema version (defaults to '1')
 */
async function publish(type, data, opts = {}) {
    if (!redis.isAvailable()) return;

    const r = redis.getClient();
    if (!r) return;

    const correlationId = opts.correlationId || uuidv4();
    const version       = opts.version       || '1';
    const timestamp     = new Date().toISOString();

    try {
        await r.xadd(
            STREAM,
            '*',
            'type',          type,
            'version',       version,
            'correlationId', correlationId,
            'data',          JSON.stringify(data),
            'timestamp',     timestamp,
        );
    } catch (err) {
        // Non-fatal — log a warning but never throw
        console.warn(`[EventBus] Failed to publish "${type}":`, err.message);
    }
}

module.exports = { publish };
