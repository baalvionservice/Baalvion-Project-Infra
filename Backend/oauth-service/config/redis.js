'use strict';
const Redis  = require('ioredis');
const logger = require('../utils/logger');
const config = require('./appConfig');

let _client = null;

async function connect() {
    if (!config.redis.host) { logger.info('[oauth-service] Redis not configured'); return; }
    try {
        _client = new Redis({
            host: config.redis.host, port: config.redis.port,
            password: config.redis.password || undefined,
            lazyConnect: true, retryStrategy: (t) => Math.min(t * 200, 5000), maxRetriesPerRequest: 1,
        });
        await _client.connect();
        logger.info('[oauth-service] Redis connected');
    } catch (err) {
        logger.warn({ err }, '[oauth-service] Redis unavailable');
        _client = null;
    }
}

function getClient()   { return _client; }
function isAvailable() { return _client !== null && _client.status === 'ready'; }

module.exports = { connect, getClient, isAvailable };
