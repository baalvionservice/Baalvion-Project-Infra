'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/sessionController');
const crypto = require('crypto');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

// HMAC service-to-service auth — shared secret in INTERNAL_SERVICE_SECRET env var
function internalAuth(req, _res, next) {
    const sig     = req.headers['x-service-signature'];
    const ts      = req.headers['x-service-timestamp'];
    const secret  = process.env.INTERNAL_SERVICE_SECRET;

    if (!secret) {
        // Dev mode — skip signing
        if (process.env.NODE_ENV !== 'production') return next();
        return next(new AppError('CONFIGURATION_ERROR', 'Internal secret not configured', 500));
    }
    if (!sig || !ts) return next(new AppError('UNAUTHORIZED', 'Missing service auth headers', 401));

    const age = Date.now() - parseInt(ts, 10);
    if (age > 30_000) return next(new AppError('UNAUTHORIZED', 'Timestamp expired', 401));

    const expected = crypto.createHmac('sha256', secret).update(`${ts}:${req.method}:${req.path}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return next(new AppError('UNAUTHORIZED', 'Invalid service signature', 401));
    }
    next();
}

router.use(internalAuth);
router.post('/analyse-login', ctrl.analyseLogin);

module.exports = router;
