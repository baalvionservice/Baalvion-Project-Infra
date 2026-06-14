'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/sessionController');
const crypto = require('crypto');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

// HMAC service-to-service auth — shared secret in INTERNAL_SERVICE_SECRET env var.
// Only true dev/test may run without the shared secret; every other env (production,
// staging, preprod, …) fails CLOSED — the prior `NODE_ENV !== 'production'` check left
// the internal endpoint silently OPEN in staging/preprod/unset env.
const RELAXED_ENVS = new Set(['development', 'test']);
function internalAuth(req, _res, next) {
    const sig     = req.headers['x-service-signature'];
    const ts      = req.headers['x-service-timestamp'];
    const secret  = process.env.INTERNAL_SERVICE_SECRET;

    if (!secret) {
        const env = process.env.NODE_ENV || 'development';
        if (RELAXED_ENVS.has(env)) return next(); // dev/test convenience only
        return next(new AppError('CONFIGURATION_ERROR', 'Internal secret not configured', 500));
    }
    if (!sig || !ts) return next(new AppError('UNAUTHORIZED', 'Missing service auth headers', 401));

    const age = Date.now() - parseInt(ts, 10);
    if (age > 30_000) return next(new AppError('UNAUTHORIZED', 'Timestamp expired', 401));

    const expected = crypto.createHmac('sha256', secret).update(`${ts}:${req.method}:${req.path}`).digest('hex');
    const sigBuf = Buffer.from(String(sig), 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return next(new AppError('UNAUTHORIZED', 'Invalid service signature', 401));
    }
    next();
}

router.use(internalAuth);
router.post('/analyse-login', ctrl.analyseLogin);

module.exports = router;
