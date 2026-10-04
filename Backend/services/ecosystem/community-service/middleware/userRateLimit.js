'use strict';
// Per-user limiter for expensive or abuse-prone writes, applied after authentication so the key
// is the account, not the IP (shared NATs would otherwise lock out unrelated people). The global
// IP limiter still runs in front of this.
const rateLimit = require('express-rate-limit');

module.exports = ({ windowMs, max, code = 'RATE_LIMITED', message = 'Too many requests, please slow down' }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `u:${(req.auth && req.auth.userId) || 'anon'}`,
    message: { success: false, error: { code, message } },
});
