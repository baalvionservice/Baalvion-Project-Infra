'use strict';
// Dedicated, tighter limiter for the WRITE-side checkout + payment endpoints (order create, payment
// intent, payment confirm). These are abuse-sensitive (card-testing, order spam) and far lower
// frequency than catalog reads, so they get their own per-IP allowance well below the global IP read
// limit applied app-wide in index.js. Env-overridable (CHECKOUT_RL_MAX / CHECKOUT_RL_WINDOW_MS); the
// `overrides` arg exists so tests can inject a low max / disable validation without touching config.
// Backed by express-rate-limit (a CodeQL-recognized limiter), per-IP via the default keyGenerator.
const rateLimit = require('express-rate-limit');

function createCheckoutRateLimit(overrides = {}) {
    return rateLimit({
        windowMs: Number(process.env.CHECKOUT_RL_WINDOW_MS || 60_000),
        max: Number(process.env.CHECKOUT_RL_MAX || 20),
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many checkout attempts, please slow down' } },
        ...overrides,
    });
}

module.exports = createCheckoutRateLimit;
