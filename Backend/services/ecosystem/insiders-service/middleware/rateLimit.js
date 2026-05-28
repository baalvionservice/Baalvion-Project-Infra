'use strict';
const config = require('../config/appConfig');

// Lightweight fixed-window in-memory IP rate limiter (no Redis dependency).
const WINDOW_MS = 60 * 1000;
const buckets = new Map();

module.exports = () => (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.reset) {
        b = { count: 0, reset: now + WINDOW_MS };
        buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > config.security.ipRateLimit) {
        res.setHeader('Retry-After', Math.ceil((b.reset - now) / 1000));
        return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' },
        });
    }
    return next();
};

// Opportunistic cleanup so the map doesn't grow unbounded.
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
}, WINDOW_MS).unref();
