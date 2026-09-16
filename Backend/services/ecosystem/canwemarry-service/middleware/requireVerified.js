'use strict';
/**
 * Gate an action on a verified email address.
 *
 * Wired but currently permissive on UNKNOWN, because the platform does not yet report
 * verification state to this service (see domain/verification.js). The middleware exists so
 * that turning enforcement on is a configuration change rather than a code change — and so
 * that the policy is readable in the route table today rather than being remembered later.
 *
 * It is deliberately NOT applied to any route yet. A middleware that always calls next()
 * while sitting in the chain reads like protection and is not, and that misreading is worse
 * than an obvious absence.
 */
const config = require('../config/appConfig');
const { stateFrom, evaluate } = require('../domain/verification');
const { forbidden } = require('../utils/errors');

const requireVerified = (action) => (req, res, next) => {
    const state = stateFrom(req.auth);
    const result = evaluate(state, action, { enforceOnUnknown: config.security.requireEmailVerification });

    if (result.allowed) return next();

    return next(forbidden(
        result.reason === 'EMAIL_NOT_VERIFIED'
            ? 'Confirm your email address before doing that. Check your inbox for the link we sent when you signed up.'
            : 'This action needs a confirmed email address, and we cannot currently check yours. Please try again shortly.',
    ));
};

module.exports = { requireVerified };
