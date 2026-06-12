'use strict';
const { v4: uuidv4 } = require('uuid');
const redis          = require('../config/redis');
const config         = require('../config/appConfig');

const STREAM = (config.eventBus && config.eventBus.stream) || 'baalvion:events';

async function publish(type, data, opts = {}) {
    if (!redis.isAvailable()) return;

    const r = redis.getClient();
    if (!r) return;

    const correlationId = opts.correlationId || uuidv4();
    const version       = opts.version       || '1';

    try {
        await r.xadd(
            STREAM,
            '*',
            'type',          type,
            'version',       version,
            'correlationId', correlationId,
            'data',          JSON.stringify(data),
            'timestamp',     new Date().toISOString(),
        );
    } catch (err) {
        // Non-fatal: event stream unavailable — log silently via stderr
        process.stderr.write(`[EventBus] Failed to publish "${type}": ${err.message}\n`);
    }
}

module.exports = { publish };
