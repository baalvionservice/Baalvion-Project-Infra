'use strict';
// IP rate limiting, mirroring ir-service/middleware/rateLimit.js.
//
// Three tiers, because the deal room's sensitive verbs are cheap to abuse and expensive to get
// wrong: signing an NDA, moving a term sheet or touching escrow is a handful of calls in normal
// use, while the read surface (discovery, listing a room) is chatty.
//
// The global IP limiter cannot cover everything by mount order alone: /webhooks is mounted ahead
// of it, because signature verification needs the raw bytes and express.json() would have eaten
// them. That left the two provider callbacks — the only paths that can mark an escrow funded or a
// signature complete — with no limit at all, so a forged-signature flood was free, and each
// rejection writes an audit row. Hence the third tier below, applied at that mount.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

const body = (msg) => ({ success: false, error: { code: 'RATE_LIMITED', message: msg } });

const createIpRateLimit = () => rateLimit({
    windowMs: 60_000,
    max: config.security.ipRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: body('Too many requests'),
});

// Deal-state changes: NDA signing, term-sheet versions, signatures, escrow.
const createDealWriteRateLimit = () => rateLimit({
    windowMs: 60_000,
    max: config.security.dealWriteRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    // Per org where we know it, so one tenant cannot exhaust another's budget from a shared egress IP.
    keyGenerator: (req) => (req.user && req.user.orgId) || req.ip,
    message: body('Too many deal actions — slow down'),
    skip: (req) => req.method === 'GET' || req.method === 'HEAD',
});

// Provider callbacks. Keyed by IP: there is no user or org here, only a remote provider that
// legitimately retries, so the ceiling is generous but finite.
const createWebhookRateLimit = () => rateLimit({
    windowMs: 60_000,
    max: config.security.webhookRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: body('Too many webhook deliveries'),
});

module.exports = { createIpRateLimit, createDealWriteRateLimit, createWebhookRateLimit };
