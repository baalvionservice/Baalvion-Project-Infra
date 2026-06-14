'use strict';
// IP rate limiter backed by express-rate-limit (a CodeQL-recognized limiter). Applied
// globally via app.use(rateLimit()) before the routers, so every route inherits it.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

module.exports = () => rateLimit({
    windowMs: 60_000,
    max: (config.security && config.security.ipRateLimit) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
