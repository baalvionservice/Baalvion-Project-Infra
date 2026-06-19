'use strict';
// Internal service-to-service authorization for committing operations a shopper must NEVER be able
// to invoke directly (e.g. confirming a reservation = committing stock without payment). The trusted
// caller is order-service, which sends `X-Internal-Key: <INVENTORY_INTERNAL_KEY>`.
//
// Policy (fail-SAFE):
//   - If an internal key IS configured (config.internal.key set): the header MUST match it
//     (constant-time compare). A browser/shopper has no way to learn the key, so it can never
//     confirm. A missing/wrong header → 401. A platform/ops staff token is also accepted as a
//     fallback so staff tooling keeps working when the key is set.
//   - If NO internal key is configured (dev): fall back to requiring an ops-level store role
//     (the supplied `rbacChain` of middlewares), so dev without the key still works for staff but
//     is NEVER open to anonymous callers.
const crypto = require('crypto');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

// Platform/ops roles that may confirm even without the internal key (staff fallback). These come
// from the canonical roles[] claim (super_admin is hierarchical and satisfies any check upstream).
const STAFF_CONFIRM_ROLES = ['platform_admin', 'super_admin', 'ops_manager'];

function timingSafeEqual(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    // Length leak is harmless here (key length is not secret); equalize length so timingSafeEqual
    // never throws on a mismatched-length input.
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

function actorHasStaffRole(req) {
    const roles = (req.auth && Array.isArray(req.auth.roles)) ? req.auth.roles : [];
    return roles.some((r) => STAFF_CONFIRM_ROLES.includes(r));
}

/**
 * Build a confirm-route guard.
 * @param {Function[]} rbacChain middlewares applied as the dev fallback when no internal key is set
 *   (e.g. [authMiddleware, loadStoreRole, requireStoreRole('ops_manager')]).
 */
function requireInternalKey(rbacChain = []) {
    return (req, res, next) => {
        const configured = config.internal && config.internal.key;
        if (configured) {
            const provided = req.get && req.get('x-internal-key');
            if (provided && timingSafeEqual(provided, configured)) return next();
            // No/wrong internal key: allow a platform/ops staff token as a fallback so internal
            // tooling still works. This requires a VALID token, so it is not anonymous-open.
            if (provided) {
                // A header was sent but did not match → reject; do not silently downgrade to RBAC.
                return next(new AppError('UNAUTHORIZED', 'Invalid internal service key', 401));
            }
            if (req.auth && actorHasStaffRole(req)) return next();
            return next(new AppError('UNAUTHORIZED', 'Internal service key required', 401));
        }
        // Dev fallback: no internal key configured → require the ops-level RBAC chain (never open).
        let idx = 0;
        const run = (err) => {
            if (err) return next(err);
            const mw = rbacChain[idx++];
            if (!mw) return next();
            return mw(req, res, run);
        };
        return run();
    };
}

module.exports = { requireInternalKey, STAFF_CONFIRM_ROLES };
