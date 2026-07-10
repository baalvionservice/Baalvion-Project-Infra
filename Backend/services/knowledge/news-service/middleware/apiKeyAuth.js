'use strict';
const crypto = require('crypto');
const config = require('../config/appConfig');
const redis = require('../config/redisClient');
const { AppError } = require('../utils/errors');

const CACHE_PREFIX = 'news:apikey:verify:';

function extractToken(req) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
    return null;
}

async function verifyWithDeveloperService(token) {
    const res = await fetch(`${config.developerService.baseUrl}/v1/keys/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': config.developerService.internalApiKey,
        },
        body: JSON.stringify({ key: token }),
    });
    if (!res.ok) throw new AppError('KEY_VERIFY_UNAVAILABLE', 'Unable to verify API key', 503);
    const body = await res.json();
    return body.data;
}

// Verifies `Authorization: Bearer bk_...` against developer-service's hot-path
// /v1/keys/verify (see Backend/services/infrastructure/developer-service). Caches
// the verified identity briefly in Redis so a burst of requests on one key doesn't
// hammer developer-service. Fails closed: if developer-service is unreachable, the
// request is rejected rather than served as if the key were valid.
async function apiKeyAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) return next(new AppError('UNAUTHORIZED', 'Missing API key', 401));

        const cacheKey = CACHE_PREFIX + crypto.createHash('sha256').update(token).digest('hex');
        let identity;
        const cached = await redis.get(cacheKey).catch(() => null);
        if (cached) {
            identity = JSON.parse(cached);
        } else {
            identity = await verifyWithDeveloperService(token);
            if (identity?.valid) {
                await redis
                    .set(cacheKey, JSON.stringify(identity), 'EX', config.quota.keyVerifyCacheTtlSeconds)
                    .catch(() => {});
            }
        }

        if (!identity?.valid) {
            return next(new AppError('UNAUTHORIZED', `Invalid API key (${identity?.reason || 'unknown'})`, 401));
        }

        req.apiKey = {
            keyId: identity.keyId,
            orgId: identity.orgId,
            mode: identity.mode,
            scopes: identity.scopes || [],
            rateLimitPerMin: identity.rateLimitPerMin,
        };
        return next();
    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError('KEY_VERIFY_UNAVAILABLE', 'Unable to verify API key', 503));
    }
}

module.exports = { apiKeyAuth };
