'use strict';
/**
 * Per-route IP rate limiter backed by express-rate-limit (a CodeQL-recognized limiter).
 *
 * Protects the PUBLIC webhook endpoint (no JWT) from floods that would otherwise hammer
 * the CMS vault lookup + ledger writes. Each createRateLimit() call returns an INDEPENDENT
 * limiter with its own store, so distinct routes (webhook vs gateway-api) get separate
 * buckets without sharing state. In-memory / per-instance — back with a Redis store
 * (@baalvion/cache) for horizontally-scaled production.
 */
const rateLimit = require('express-rate-limit');

// `key` is retained for call-site compatibility; each limiter already has its own store.
function createRateLimit({ windowMs = 60_000, max = 60, key = 'rl' } = {}) {
    void key;
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    });
}

module.exports = { createRateLimit };
