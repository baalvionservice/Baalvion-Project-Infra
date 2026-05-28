'use strict';

/**
 * Shared ioredis client (singleton).
 *
 * Used for session validity, token-version caching, membership caching and
 * distributed rate limiting. If REDIS_URL is not configured the client is
 * `null` and every caller MUST degrade safely to the database (fail-closed for
 * security checks, never fail-open).
 */

const IORedis = require('ioredis');
const config = require('../config/appConfig');
const logger = require('./logger');

let client = null;
let warned = false;

function getRedis() {
  if (client) return client;

  if (!config.redis.url) {
    if (!warned) {
      logger.error('[redis] REDIS_URL not set — session/token-version checks fall back to the database');
      warned = true;
    }
    return null;
  }

  client = new IORedis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: () => true,
  });

  client.on('error', (err) => logger.error('[redis]', err.message));
  client.on('connect', () => logger.info('[redis] connected'));

  return client;
}

module.exports = { getRedis };
