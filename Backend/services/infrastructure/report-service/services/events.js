'use strict';
// Thin publisher onto the platform event bus (baalvion:events). Envelope matches
// what audit-service / notification-service consume: _type + _payload (+ _source).
const redis = require('../config/redis');
const logger = require('../utils/logger');

const STREAM = process.env.EVENT_BUS_STREAM || 'baalvion:events';

async function publish(type, payload = {}, opts = {}) {
    const r = redis.getClient();
    if (!r) return false;
    try {
        const fields = ['_type', type, '_payload', JSON.stringify({ ...payload, _source: 'report-service' }), '_source', 'report-service'];
        if (opts.correlationId) fields.push('_correlationId', String(opts.correlationId));
        await r.xadd(STREAM, 'MAXLEN', '~', '100000', '*', ...fields);
        return true;
    } catch (err) {
        logger.warn({ err: err.message, type }, '[report-service] event publish failed');
        return false;
    }
}

module.exports = { publish, STREAM };
