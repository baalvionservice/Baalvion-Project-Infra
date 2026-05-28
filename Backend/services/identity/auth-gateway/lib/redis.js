'use strict';
// Shared ioredis client (sessions + the canonical auth:blacklist:<jti> namespace).
const Redis = require('ioredis');
const config = require('../config/appConfig');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 2,
});
redis.on('error', (e) => console.error('[auth-gateway] redis error:', e.message));

module.exports = redis;
