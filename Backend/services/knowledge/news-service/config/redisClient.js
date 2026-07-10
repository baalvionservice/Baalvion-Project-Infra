'use strict';
const Redis = require('ioredis');
const config = require('./appConfig');

const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
});

redis.on('error', (err) => {
    console.error('[news-service] Redis error:', err.message);
});

// BullMQ requires its own connection with maxRetriesPerRequest: null.
function newQueueConnection() {
    return new Redis(config.redis.url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    });
}

module.exports = redis;
module.exports.newQueueConnection = newQueueConnection;
