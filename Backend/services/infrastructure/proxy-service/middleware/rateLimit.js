'use strict';
// IP rate limiter backed by express-rate-limit (a CodeQL-recognized limiter). Applied
// globally via app.use(createIpRateLimit()) before the routers, so every route inherits it.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

const RATE_LIMITED = { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } };

// Coarse global IP ceiling (RATE_LIMIT_IP_MAX, default 120). This is the backstop; it is intentionally
// generous because public catalog reads share it. Sensitive money/auth routes layer a stricter limiter.
function createIpRateLimit() {
    return rateLimit({
        windowMs: 60_000,
        max: (config.security && config.security.ipRateLimit) || 120,
        standardHeaders: true,
        legacyHeaders: false,
        message: RATE_LIMITED,
    });
}

// Tight per-endpoint limiter for sensitive surfaces (checkout, auth, OTP). A coarse 1000 RPM IP ceiling is
// not enough to stop promo-code brute force or rapid checkout enumeration against ONE endpoint, so money/auth
// routes get their own low cap. Keys by authenticated org when present (so one user's retries don't exhaust a
// shared NAT egress IP for everyone), else by IP. Default 15 req/min; override per-call or via env.
function createStrictRateLimit(max, opts = {}) {
    return rateLimit({
        windowMs: 60_000,
        max: max || 15,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => (req.auth && (req.auth.orgId || req.auth.userId)) ? `org:${req.auth.orgId || req.auth.userId}` : (req.ip || 'unknown'),
        message: RATE_LIMITED,
        ...opts,
    });
}

module.exports = createIpRateLimit;
module.exports.strict = createStrictRateLimit;
