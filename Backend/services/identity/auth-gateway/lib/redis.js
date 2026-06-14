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

/**
 * Tenant kill-switch read. Returns true only when auth-service has flagged the org
 * as suspended (key auth:org_suspended:<orgId> === '1'). Fail-OPEN on any error or
 * missing orgId: a Redis outage must not lock every tenant out — the authoritative
 * DB-side session/refresh revocation still applies.
 */
redis.isOrgSuspended = async function isOrgSuspended(orgId) {
  if (!orgId) return false;
  try {
    return (await redis.get(`auth:org_suspended:${orgId}`)) === '1';
  } catch {
    return false;
  }
};

module.exports = redis;
