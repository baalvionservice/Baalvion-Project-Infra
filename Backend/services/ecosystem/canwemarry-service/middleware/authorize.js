'use strict';
/**
 * Capability gates.
 *
 * These answer "may an actor of this kind do this AT ALL". They are the coarse half of
 * authorization; the fine half — may this actor touch THIS record — lives in
 * domain/visibility.js and is applied inside the services. A route that only calls
 * requirePermission is not yet safe, and every case route pairs the two.
 */
const { can, canAny, PERMISSIONS } = require('../domain/permissions');
const { ROLES } = require('../domain/roles');
const { unauthorized, forbidden } = require('../utils/errors');

const actorOf = (req) => req.actor || { userId: null, roles: [] };

const requirePermission = (...permissions) => (req, res, next) => {
    const actor = actorOf(req);
    if (!canAny(actor, permissions)) {
        // An anonymous caller gets 401 (log in and you may be able to), an authenticated
        // one gets 403 (logging in again will not help).
        return next(actor.userId ? forbidden() : unauthorized());
    }
    return next();
};

const requireRole = (...roles) => (req, res, next) => {
    const actor = actorOf(req);
    if (!actor.userId) return next(unauthorized());
    if (!roles.some((r) => actor.roles.includes(r))) return next(forbidden());
    return next();
};

/** Everything under /admin: staff only, and audited by the routes themselves. */
const requireStaff = requireRole(ROLES.MODERATOR, ROLES.ADMIN);
const requireAdmin = requireRole(ROLES.ADMIN);

module.exports = { requirePermission, requireRole, requireStaff, requireAdmin, can, PERMISSIONS };
