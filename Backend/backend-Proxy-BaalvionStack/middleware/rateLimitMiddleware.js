'use strict';

/**
 * Distributed rate-limit middleware factory (Redis sliding window).
 * Keys by API key → org → IP (most specific available). Plan-aware limits.
 */

const rateLimiter = require('../service/rateLimiter');
const metrics = require('../observability/authMetrics');
const { AppError } = require('../utils/errors');

function keyForRequest(req) {
  if (req.auth && req.auth.apiKeyId) return `key:${req.auth.apiKeyId}`;
  if (req.auth && req.auth.organizationId) return `org:${req.auth.organizationId}`;
  return `ip:${req.ip}`;
}

/**
 * @param {object} opts
 * @param {string} [opts.scope='api']  metric/label + key namespace
 * @param {number} [opts.perMin]       override; defaults to plan limit
 * @param {function} [opts.keyBy]      custom key extractor
 */
function rateLimit(opts = {}) {
  const scope = opts.scope || 'api';
  const windowMs = opts.windowMs || 60_000;
  return async (req, res, next) => {
    const plan = (req.organization && req.organization.plan) || (req.auth && req.auth.plan);
    const limit = opts.perMin || rateLimiter.planLimits(plan).requestsPerMin;
    const key = `${scope}:${(opts.keyBy ? opts.keyBy(req) : keyForRequest(req))}`;

    const result = await rateLimiter.slidingWindow(key, limit, windowMs);
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      metrics.incRateLimitHit(scope);
      res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      return next(new AppError('RATE_LIMITED', 'Rate limit exceeded', 429, { retryAfterMs: result.retryAfterMs }));
    }
    return next();
  };
}

/** Pre-auth IP limiter (e.g. login/refresh) — fixed budget, keyed by IP only. */
function ipRateLimit(perMin = 30) {
  return rateLimit({ scope: 'ip', perMin, keyBy: (req) => `ip:${req.ip}` });
}

module.exports = { rateLimit, ipRateLimit };
