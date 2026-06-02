'use strict';
// PUBLIC staff route — invitation acceptance is token-authenticated, so it must
// sit OUTSIDE the bearer-token authMiddleware. Mounted under /v1/staff before
// authMiddleware; non-matching paths fall through to the authenticated router.
const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl      = require('../controller/staffController');

// Tighter limit on the public acceptance endpoint to prevent token-brute-forcing
// and abuse. 20 req/min per IP is generous for a human-driven flow.
const acceptLimiter = rateLimit({
    windowMs:        60_000,
    max:             20,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests — please try again later' } },
});

router.post('/invitations/accept', acceptLimiter, ctrl.acceptInvitation);

module.exports = router;
