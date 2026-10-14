'use strict';
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const { hasAccessPass } = require('../service/accessPass');

const rolesOf = (req) => [req.auth && req.auth.role, ...(Array.isArray(req.auth && req.auth.roles) ? req.auth.roles : [])].filter(Boolean);

// Put after authMiddleware. Signed-out callers get 401, signed-in callers without a pass get 402 with the price,
// so the frontend can send them to the pass page instead of showing a generic failure.
async function requireAccessPass(req, res, next) {
    try {
        if (!config.accessPass.enforce) return next();
        if (!req.auth || req.auth.userId == null) return next(new AppError('UNAUTHORIZED', 'Sign in to do this', 401));
        if (await hasAccessPass(req.auth.userId, rolesOf(req))) return next();
        return next(new AppError('ACCESS_PASS_REQUIRED', `This needs the one-time $${config.accessPass.priceUsd} access pass. You can get it on the Access Pass page (/buyer-pass).`, 402, { priceUsd: config.accessPass.priceUsd }));
    } catch (err) {
        return next(err);
    }
}

module.exports = { requireAccessPass };
