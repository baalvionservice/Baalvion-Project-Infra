'use strict';
// Thin publisher onto the platform event bus (baalvion:events). Envelope matches
// what audit-service / developer-service consume: _type + _payload (+ _source).
const redis = require('../config/redis');
const logger = require('../utils/logger');
const config = require('../config/appConfig');

async function publish(type, payload = {}) {
    const r = redis.getClient();
    if (!r) return false;
    try {
        await r.xadd(config.eventBus.stream, 'MAXLEN', '~', '100000', '*',
            '_type', type, '_payload', JSON.stringify({ ...payload, _source: 'agent-service' }), '_source', 'agent-service');
        return true;
    } catch (err) {
        logger.warn({ err: err.message, type }, '[agent-service] event publish failed');
        return false;
    }
}

module.exports = { publish };
