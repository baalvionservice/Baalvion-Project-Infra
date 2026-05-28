'use strict';
const { randomBytes } = require('crypto');
const { AppError }    = require('../utils/errors');
const config          = require('../config/appConfig');

// Not HttpOnly — JS must be able to read it to send in the header
const CSRF_COOKIE  = 'baalvion-csrf';
const CSRF_HEADER  = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Sets a CSRF token cookie on every response that doesn't already have one.
 * Mount this early (before route handlers) so the token is always available.
 */
function csrfTokenMiddleware(req, res, next) {
    if (!req.cookies?.[CSRF_COOKIE]) {
        const token = randomBytes(32).toString('base64url');
        res.cookie(CSRF_COOKIE, token, {
            httpOnly: false, // intentional — client JS reads it and sends in X-CSRF-Token header
            secure:   config.env === 'production',
            sameSite: 'strict',
            maxAge:   24 * 60 * 60 * 1000,
            path:     '/',
        });
        req.csrfToken = token;
    } else {
        req.csrfToken = req.cookies[CSRF_COOKIE];
    }
    next();
}

/**
 * Validates that the X-CSRF-Token header matches the cookie value.
 * Skip safe methods (GET/HEAD/OPTIONS) — they must not mutate state.
 * Skip requests that carry a Bearer token — CSRF only matters for cookie-auth paths.
 */
function csrfProtect(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    // Bearer-authenticated requests are not CSRF-vulnerable (custom header = not CORS-simple)
    if (req.headers.authorization?.startsWith('Bearer ')) return next();

    const cookieToken  = req.cookies?.[CSRF_COOKIE];
    const headerToken  = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next(new AppError('CSRF_FAILED', 'CSRF validation failed', 403));
    }
    next();
}

module.exports = { csrfTokenMiddleware, csrfProtect, CSRF_COOKIE };
