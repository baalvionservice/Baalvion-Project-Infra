'use strict';
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

module.exports = () => rateLimit({
    windowMs: config.rateLimit.windowMs,
    max:      config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});
