'use strict';
const config = require('../config/appConfig');
const redis = require('../config/redisClient');
const { AppError } = require('../utils/errors');

const QUOTA_PREFIX = 'news:quota:';

function dailyLimitFor(apiKey) {
    const scopeLimit = (apiKey.scopes || [])
        .map((scope) => /^quota:(\d+)$/.exec(scope))
        .find(Boolean);
    return scopeLimit ? Number(scopeLimit[1]) : config.quota.freeDailyLimit;
}

function secondsUntilUtcMidnight() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

// Per-API-key daily request quota (Free tier default: 100/day — see appConfig.quota).
// Must run after apiKeyAuth so req.apiKey is populated. Fails open on Redis errors:
// a quota-tracking outage should not take the public API down.
async function quota(req, res, next) {
    if (!req.apiKey) return next(new AppError('UNAUTHORIZED', 'API key not verified', 401));

    const limit = dailyLimitFor(req.apiKey);
    const dayBucket = new Date().toISOString().slice(0, 10);
    const key = `${QUOTA_PREFIX}${req.apiKey.keyId}:${dayBucket}`;

    try {
        const used = await redis.incr(key);
        if (used === 1) await redis.expire(key, secondsUntilUtcMidnight());

        const remaining = Math.max(limit - used, 0);
        res.set('X-RateLimit-Limit', String(limit));
        res.set('X-RateLimit-Remaining', String(remaining));
        res.set('X-RateLimit-Reset', String(secondsUntilUtcMidnight()));

        if (used > limit) {
            return next(new AppError('QUOTA_EXCEEDED', 'Daily request quota exceeded', 429));
        }
        return next();
    } catch (err) {
        console.error('[news-service] quota check failed, failing open:', err.message);
        return next();
    }
}

module.exports = { quota };
