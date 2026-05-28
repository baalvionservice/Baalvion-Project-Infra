'use strict';
const Redis  = require('ioredis');
const logger = require('../utils/logger');
const config = require('./appConfig');

let _client = null;

async function connect() {
    if (!config.redis.host) {
        logger.info('[admin-service] Redis host not configured — running without Redis');
        return;
    }
    try {
        _client = new Redis({
            host:           config.redis.host,
            port:           config.redis.port,
            password:       config.redis.password || undefined,
            lazyConnect:    true,
            retryStrategy:  (times) => Math.min(times * 200, 5000),
            maxRetriesPerRequest: 1,
        });
        await _client.connect();
        logger.info('[admin-service] Redis connected');
    } catch (err) {
        logger.warn({ err }, '[admin-service] Redis unavailable — running in degraded mode');
        _client = null;
    }
}

function getClient()    { return _client; }
function isAvailable()  { return _client !== null && _client.status === 'ready'; }

module.exports = { connect, getClient, isAvailable };
