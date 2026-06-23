'use strict';
const config = require('../config/appConfig');

let expressRateLimit;
try { expressRateLimit = require('express-rate-limit'); }
catch (err) { console.error(`[${config.service}] express-rate-limit unavailable; using no-op limiter:`, err.message); }

module.exports = () => {
    const max = config.security?.ipRateLimit || 120;
    if (expressRateLimit) {
        const rateLimit = typeof expressRateLimit === 'function'
            ? expressRateLimit
            : (expressRateLimit.default || expressRateLimit.rateLimit || expressRateLimit);
        return rateLimit({
            windowMs: 60_000, max, standardHeaders: true, legacyHeaders: false,
            message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        });
    }
    console.warn(`[rateLimit] express-rate-limit not installed; rate limiting DISABLED for ${config.service}.`);
    return (_req, _res, next) => next();
};
