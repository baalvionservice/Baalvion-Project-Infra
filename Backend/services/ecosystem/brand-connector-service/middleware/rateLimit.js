const config = require('../config/appConfig');

const windows = new Map();

const rateLimit = (max, windowMs = 60_000) => (req, res, next) => {
    // Behind the same-origin BFF every request arrives from the proxy's IP, so keying on req.ip
    // alone would turn a per-client limit into a global cap. Prefer the real client from the
    // X-Forwarded-For chain (Next forwards it on the rewrite path) and fall back to req.ip.
    const fwd = req.headers['x-forwarded-for'];
    const key = (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.ip;
    const now = Date.now();
    const entry = windows.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
    entry.count++;
    windows.set(key, entry);
    if (entry.count > max) {
        return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Too many requests' },
        });
    }
    return next();
};

module.exports = () => rateLimit(config.security?.ipRateLimit || 120);
