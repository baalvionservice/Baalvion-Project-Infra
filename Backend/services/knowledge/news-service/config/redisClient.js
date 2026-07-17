'use strict';
const Redis = require('ioredis');
const config = require('./appConfig');

// A connection-string URL and discrete host/port/password are mutually exclusive
// ioredis call shapes — build whichever the config actually provided.
function makeRedis(extraOpts) {
    if (config.redis.url) return new Redis(config.redis.url, extraOpts);
    return new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password, ...extraOpts });
}

const redis = makeRedis({ maxRetriesPerRequest: 3, lazyConnect: false });

redis.on('error', (err) => {
    console.error('[news-service] Redis error:', err.message);
});

// BullMQ requires its own connection with maxRetriesPerRequest: null.
function newQueueConnection() {
    return makeRedis({ maxRetriesPerRequest: null, enableReadyCheck: true });
}

module.exports = redis;
module.exports.newQueueConnection = newQueueConnection;
