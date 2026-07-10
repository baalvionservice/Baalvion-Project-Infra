'use strict';
// IP rate limiter backed by express-rate-limit, applied globally before the routers.
// This guards against abusive request volume at the network level; per-API-key quota
// (Free/Starter/Growth/Pro) is enforced separately by middleware/quota.js.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

module.exports = () => rateLimit({
    windowMs: 60_000,
    max: (config.security && config.security.ipRateLimit) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
