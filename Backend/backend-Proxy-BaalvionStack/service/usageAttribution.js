'use strict';

/**
 * Usage attribution.
 *
 * Every authenticated request/connection emits an attribution event carrying
 * the identifiers billing, metering, analytics and abuse detection need. Events
 * are pushed to a Redis Stream (`usage:events`) which a downstream metering
 * worker consumes. If Redis is unavailable the event is logged (structured) so
 * nothing is silently lost.
 */

const { getRedis } = require('./redisClient');
const logger = require('./logger');

const STREAM = process.env.USAGE_STREAM || 'usage:events';
const MAXLEN = Number(process.env.USAGE_STREAM_MAXLEN || 1_000_000);

/** Build the attribution context from a request's auth state. */
function contextFrom(req) {
  const a = req.auth || {};
  return {
    organizationId: a.organizationId || null,
    apiKeyId: a.apiKeyId || null,
    userId: a.userId || null,
    sessionId: a.sessionId || null,
    authType: a.type || a.authType || 'unknown',
    plan: (req.organization && req.organization.plan) || null,
  };
}

/**
 * Emit a usage event.
 * @param {object} req  Express request (attribution derived from req.auth)
 * @param {object} event { kind, route, bytesIn?, bytesOut?, country?, sessionToken?, ... }
 */
async function emit(req, event = {}) {
  const ctx = contextFrom(req);
  const payload = {
    ts: String(Date.now()),
    kind: event.kind || 'api.request',
    org: ctx.organizationId || '',
    apiKey: ctx.apiKeyId || '',
    user: ctx.userId != null ? String(ctx.userId) : '',
    session: event.sessionToken || ctx.sessionId || '',
    authType: ctx.authType,
    route: event.route || (req.originalUrl ? req.originalUrl.split('?')[0] : ''),
    method: req.method || '',
    bytesIn: String(event.bytesIn || 0),
    bytesOut: String(event.bytesOut || 0),
    country: event.country || '',
    ip: req.ip || '',
  };

  const redis = getRedis();
  if (!redis) {
    logger.info('[usage]', JSON.stringify(payload));
    return;
  }
  try {
    // XADD with approximate trimming to bound stream growth.
    const flat = [];
    for (const [k, v] of Object.entries(payload)) flat.push(k, v);
    await redis.xadd(STREAM, 'MAXLEN', '~', MAXLEN, '*', ...flat);
  } catch (err) {
    logger.error('[usage] xadd failed:', err.message, JSON.stringify(payload));
  }
}

/** Express middleware that emits an attribution event after auth. */
function attributeUsage(kind = 'api.request') {
  return (req, res, next) => {
    emit(req, { kind }).catch(() => {});
    next();
  };
}

module.exports = { emit, attributeUsage, contextFrom };
