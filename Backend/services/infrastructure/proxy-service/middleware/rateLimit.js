const config = require('../config/appConfig');

const buckets = new Map();

const takeToken = (key, limit, windowMs) => {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (bucket.count >= limit) {
        return false;
    }

    bucket.count += 1;
    return true;
};

const rateLimit = () => (req, res, next) => {
    const windowMs = 60000;
    const ipAllowed = takeToken(`ip:${req.ip}`, config.security.ipRateLimit, windowMs);
    if (!ipAllowed) {
        return res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMITED',
                message: 'Too many requests from this IP',
                details: {},
                requestId: req.requestId,
            },
        });
    }

    if (req.auth?.userId) {
        const userAllowed = takeToken(`user:${req.auth.userId}`, config.security.userRateLimit, windowMs);
        if (!userAllowed) {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests for this user',
                    details: {},
                    requestId: req.requestId,
                },
            });
        }
    }

    return next();
};

module.exports = rateLimit;