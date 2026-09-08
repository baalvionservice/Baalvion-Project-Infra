'use strict';
/**
 * The authentication boundary.
 *
 * Verification is RS256-only, delegated to @baalvion/auth-node — the platform's single
 * token authority (system contract rules C3/C6). This service never signs a token, never
 * reads a password and holds no credential of its own.
 *
 * Two gates, and the difference matters:
 *   requireAuth   — 401 without a verified identity.
 *   optionalAuth  — resolves an identity when one is present, anonymous otherwise. Used
 *                   on read routes that serve public cases, so an anonymous caller gets
 *                   the anonymous permission set rather than an error.
 *
 * On first sight of a verified subject the service provisions a local `users` row and the
 * baseline USER role. That row carries no identity data; it exists so cases, consent and
 * moderation history have something to hang a foreign key on.
 */
const { createAuthMiddleware } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError, unauthorized, forbidden } = require('../utils/errors');
const userService = require('../service/userService');
const { stateFrom } = require('../domain/verification');

const verifyToken = createAuthMiddleware({
    jwksUri: config.jwt.jwksUri || undefined,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message || 'Authentication failed', err.status || 401);

/**
 * Resolve the verified subject into a CanWeMarry actor: the local user row plus the
 * product roles held in user_roles. Platform roles from the token are NOT merged in —
 * being an admin of another Baalvion product grants nothing here.
 */
async function attachActor(req) {
    // req.auth.userId is the issuer's `sub`. provision() maps it to the LOCAL user row,
    // and everything downstream uses that local id.
    const user = await userService.provision(req.auth.userId);

    if (user.status === 'SUSPENDED' && (!user.suspended_until || user.suspended_until > new Date())) {
        throw forbidden('This account is suspended.');
    }
    if (user.status === 'DEACTIVATED') {
        throw forbidden('This account has been deactivated.');
    }

    req.actor = {
        userId: user.id,          // local uuid, not the issuer's subject
        subject: user.platform_subject,
        roles: await userService.rolesFor(user.id),
        status: user.status,
        // Read from the token, never stored here: auth-service owns this fact and a copy
        // would go stale the moment somebody verified. Publishing a case is gated on it in
        // the service layer, where both the create and the update path meet.
        verification: stateFrom(req.auth),
    };
}

const requireAuth = (req, res, next) => verifyToken(req, res, async (err) => {
    if (err) return next(toAppError(err));
    try {
        await attachActor(req);
        return next();
    } catch (e) {
        return next(e);
    }
});

const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        req.actor = { userId: null, roles: [] };
        return next();
    }
    // A token that IS present must be valid. Falling through to anonymous on a bad token
    // would turn an expired session into a silent downgrade instead of a visible 401.
    return requireAuth(req, res, next);
};

const requireActor = (req) => {
    if (!req.actor || !req.actor.userId) throw unauthorized();
    return req.actor;
};

module.exports = { requireAuth, optionalAuth, requireActor };
