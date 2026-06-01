'use strict';
/**
 * Minimal dependency-free fixed-window rate limiter (per IP + route key).
 *
 * Protects the PUBLIC webhook endpoint (no JWT) from floods that would otherwise
 * hammer the CMS vault lookup + ledger writes. In-memory / per-instance — for
 * horizontally-scaled production this should be backed by Redis (@baalvion/cache);
 * the per-instance limiter is a real, cheap first line of defence.
 */
const { logger } = require('../platform/logger');

function createRateLimit({ windowMs = 60_000, max = 60, key = 'rl' } = {}) {
    const hits = new Map(); // ip → { count, resetAt }
    return function rateLimit(req, res, next) {
        const now = Date.now();
        const ip = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
        const bucketKey = `${key}:${ip}`;
        let entry = hits.get(bucketKey);
        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(bucketKey, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            const retry = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retry));
            try { logger('ratelimit').warn({ ip, route: key, count: entry.count }, 'rate limit exceeded'); } catch { /* noop */ }
            return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
        }
        // Opportunistic cleanup so the map can't grow unbounded.
        if (hits.size > 5000) {
            for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
        }
        return next();
    };
}

module.exports = { createRateLimit };
