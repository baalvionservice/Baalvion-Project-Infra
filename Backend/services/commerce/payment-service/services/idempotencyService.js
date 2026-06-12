const redis = require('redis');
const config = require('../config/appConfig');

let client;

/**
 * Idempotency Service: Prevent duplicate transaction processing
 * Uses Redis to store transaction results for 24 hours
 */

async function init() {
  client = redis.createClient({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
  });

  client.on('error', () => { /* Redis errors surface via checkIdempotency/storeResult rejections */ });
  await client.connect();
  return client;
}

/**
 * Check if idempotency key already exists
 */
async function checkIdempotency(tenantId, idempotencyKey) {
  if (!client) await init();

  const key = `idempotency:${tenantId}:${idempotencyKey}`;
  const existing = await client.get(key);

  if (existing) {
    return { isDuplicate: true, result: JSON.parse(existing) };
  }

  return { isDuplicate: false };
}

/**
 * Store transaction result in idempotency cache
 */
async function storeResult(tenantId, idempotencyKey, result) {
  if (!client) await init();

  const key = `idempotency:${tenantId}:${idempotencyKey}`;
  const ttl = config.idempotency.ttl;

  await client.setEx(
    key,
    ttl,
    JSON.stringify({
      ...result,
      cachedAt: new Date().toISOString(),
    })
  );

  // result stored; no per-key debug log in production
}

/**
 * Clear idempotency record (for testing)
 */
async function clearRecord(tenantId, idempotencyKey) {
  if (!client) await init();

  const key = `idempotency:${tenantId}:${idempotencyKey}`;
  await client.del(key);
}

module.exports = {
  init,
  checkIdempotency,
  storeResult,
  clearRecord,
};
