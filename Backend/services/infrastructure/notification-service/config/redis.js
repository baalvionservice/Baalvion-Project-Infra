'use strict';
const Redis  = require('ioredis');
const logger = require('../utils/logger');
const config = require('./appConfig');

let _client    = null;
let _subscriber = null;  // dedicated connection for blocking reads

function createConnection(lazyConnect = true) {
    return new Redis({
        host:                 config.redis.host,
        port:                 config.redis.port,
        password:             config.redis.password || undefined,
        lazyConnect,
        enableReadyCheck:     true,
        maxRetriesPerRequest: null,  // required by BullMQ
        retryStrategy:        (times) => Math.min(times * 200, 5_000),
    });
}

async function connect() {
    try {
        _client = createConnection(true);
        await _client.connect();
        logger.info('[notification-service] Redis connected');
    } catch (err) {
        logger.warn({ err }, '[notification-service] Redis unavailable');
        _client = null;
    }
}

// BullMQ requires its own connections (maxRetriesPerRequest: null)
function newConnection() {
    return createConnection(false);
}

function getClient()    { return _client; }
function isAvailable()  { return _client !== null && _client.status === 'ready'; }

module.exports = { connect, getClient, isAvailable, newConnection };
