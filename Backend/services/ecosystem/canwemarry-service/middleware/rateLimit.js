'use strict';
// express-rate-limit, applied in three tiers. Reads are cheap and generous; writes are
// tighter; reporting is tightest, because a report queue that can be flooded is a
// denial-of-service against the moderators the safety model depends on.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

const base = {
    windowMs: 60_000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
};

// Authenticated callers are limited per account so that everyone behind one NAT or
// campus network does not share a single budget.
const keyByActor = (req) => (req.auth && req.auth.userId) || req.ip;

const ipLimiter = () => rateLimit({ ...base, max: config.security.ipRateLimit });
const writeLimiter = () => rateLimit({ ...base, max: config.security.writeRateLimit, keyGenerator: keyByActor });
const reportLimiter = () => rateLimit({ ...base, windowMs: 300_000, max: config.security.reportRateLimit, keyGenerator: keyByActor });

module.exports = { ipLimiter, writeLimiter, reportLimiter };
