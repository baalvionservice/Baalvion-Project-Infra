'use strict';
const redis     = require('../config/redis');
const { AppError } = require('../utils/errors');

/**
 * Creates a Redis-backed sliding-window rate limiter for a specific route.
 * Falls back gracefully to no-op when Redis is unavailable.
 *
 * @param {object} opts
 * @param {number}   opts.max      Max requests per window
 * @param {number}   opts.window   Window duration in seconds
 * @param {string}   opts.prefix   Redis key prefix (e.g. 'auth:rl:register')
 * @param {Function} opts.keyFn    (req) => string  — the rate-limit identity
 * @param {string}  [opts.message] Custom error message
 */
function createRateLimiter({ max, window: windowSecs, prefix, keyFn, message }) {
    return async function rateLimiter(req, res, next) {
        try {
            const client = redis.getClient();
            if (!client || !redis.isAvailable()) return next();

            const key = `${prefix}:${keyFn(req)}`;
            const [[, count]] = await client.pipeline()
                .incr(key)
                .expire(key, windowSecs)
                .exec();

            const remaining = Math.max(0, max - count);
            res.set('X-RateLimit-Limit',     String(max));
            res.set('X-RateLimit-Remaining', String(remaining));
            res.set('X-RateLimit-Reset',     String(Math.floor(Date.now() / 1000) + windowSecs));

            if (count > max) {
                return next(new AppError('RATE_LIMITED', message || 'Too many requests. Please slow down.', 429));
            }
        } catch (err) {
            // Redis error — fail open to avoid blocking users
        }
        next();
    };
}

// Pre-configured limiters
const registerLimiter     = createRateLimiter({ max: 5,  window: 3600,  prefix: 'auth:rl:reg',   keyFn: (req) => req.ip, message: 'Too many registrations from this IP. Try again in an hour.' });
const forgotPwLimiter     = createRateLimiter({ max: 5,  window: 3600,  prefix: 'auth:rl:fp',    keyFn: (req) => req.ip, message: 'Too many password reset requests. Try again in an hour.' });
const verifyEmailLimiter  = createRateLimiter({ max: 10, window: 3600,  prefix: 'auth:rl:ve',    keyFn: (req) => req.ip });
const mfaChallengeLimiter = createRateLimiter({ max: 10, window: 300,   prefix: 'auth:rl:mfa',   keyFn: (req) => req.ip, message: 'Too many MFA attempts. Try again in 5 minutes.' });
const verifyTokenLimiter  = createRateLimiter({ max: 60, window: 60,    prefix: 'auth:rl:vtok',  keyFn: (req) => req.ip });
// Phone OTP — keyed by the authenticated user (authMiddleware runs first), IP as a fallback.
const otpRequestLimiter   = createRateLimiter({ max: 5,  window: 3600,  prefix: 'auth:rl:otpreq', keyFn: (req) => (req.auth?.userId || req.ip), message: 'Too many verification codes requested. Try again later.' });
const otpVerifyLimiter    = createRateLimiter({ max: 15, window: 900,   prefix: 'auth:rl:otpver', keyFn: (req) => (req.auth?.userId || req.ip), message: 'Too many verification attempts. Try again later.' });
// Email-OTP login — UNauthenticated, so keyed by IP. The per-email resend cooldown + single-live-code
// invariant in emailLoginService bound abuse of any one address; this caps email-bombing across many.
const emailOtpRequestLimiter = createRateLimiter({ max: 20, window: 3600, prefix: 'auth:rl:eotpreq', keyFn: (req) => req.ip, message: 'Too many login codes requested. Try again later.' });
const emailOtpVerifyLimiter  = createRateLimiter({ max: 30, window: 900,  prefix: 'auth:rl:eotpver', keyFn: (req) => req.ip, message: 'Too many login attempts. Try again later.' });

module.exports = {
    createRateLimiter,
    registerLimiter,
    forgotPwLimiter,
    verifyEmailLimiter,
    mfaChallengeLimiter,
    verifyTokenLimiter,
    otpRequestLimiter,
    otpVerifyLimiter,
    emailOtpRequestLimiter,
    emailOtpVerifyLimiter,
};
