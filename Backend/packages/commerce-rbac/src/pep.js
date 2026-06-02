'use strict';
// Express middleware factory — the enforcement surface every commerce service mounts. Produces
// loadStoreRole / loadAccessScope / requireStoreRole, identical across services. Denials are
// audited (cross_scope_attempt vs access_denied). Fail-closed by default.
const { STORE_ROLE_LEVEL } = require('./capability');
const { makeErrorFactory, isUnreachable } = require('./errors');
const { NOOP_AUDIT } = require('./audit');

const bearer = (req) => (req.get ? req.get('authorization') : undefined);
const jwtRolesOf = (req) =>
    Array.isArray(req.auth && req.auth.roles) ? req.auth.roles
        : (req.auth && req.auth.role != null ? [req.auth.role] : []);
const resolveStoreId = (req) =>
    (req.params && req.params.storeId) ||
    (req.get && req.get('X-Store-ID')) ||
    (req.body && req.body.storeId) ||
    (req.query && req.query.storeId) || null;
const actionOf = (req) => `${req.method} ${req.originalUrl || req.url || ''}`;

/**
 * @param {object} deps
 * @param {object} deps.scope            from createScopeResolver
 * @param {function} deps.resolveStoreScope  (storeId, {token}) => {id, countryCode, ...} | null
 * @param {object} [deps.config]         { failMode }
 * @param {function} [deps.AppError]
 * @param {object} [deps.audit]
 */
function createPep({ scope, resolveStoreScope, config = {}, AppError, audit = NOOP_AUDIT } = {}) {
    const error = makeErrorFactory(AppError);
    const failMode = (config.failMode || 'closed').toLowerCase();

    // Resolves the caller's capability for the addressed store and stamps it on req.
    // A store the caller has NO role in → 403 + cross_scope_attempt audit (boundary breach).
    async function loadStoreRole(req, res, next) {
        try {
            if (!req.auth) return next(error('UNAUTHORIZED', 'Authentication required', 401));
            const storeId = resolveStoreId(req);
            if (!storeId) return next(error('BAD_REQUEST', 'storeId is required', 400));

            const token = bearer(req);
            const store = await resolveStoreScope(storeId, { token });
            if (!store) return next(error('NOT_FOUND', 'Store not found', 404));

            const cap = await scope.resolveStoreCapability({ userId: req.auth.userId, token, store, jwtRoles: jwtRolesOf(req) });
            if (!cap || cap.level <= 0) {
                audit.crossScopeAttempt({
                    userId: req.auth.userId, scope: { type: 'store', id: storeId, countryCode: store.countryCode },
                    action: actionOf(req), reason: 'no_role_for_store', requestId: req.requestId,
                });
                return next(error('FORBIDDEN', 'You do not have a role on this store', 403));
            }
            req.storeRole = cap.role;
            req.storeLevel = cap.level;
            req.storeId = storeId;
            req.storeScope = store;
            req.storeCapVia = cap.viaScope;
            return next();
        } catch (err) {
            // resolveStoreCapability already applied fail policy ('open' → level 0 denied above,
            // 'closed' → rethrew 503). Either way store access is never granted on RBAC outage.
            return next(err);
        }
    }

    function requireStoreRole(...minRoles) {
        return (req, res, next) => {
            if (req.storeLevel === undefined) return next(error('FORBIDDEN', 'Store access not verified', 403));
            const minLevel = Math.min(...minRoles.map((r) => (typeof r === 'number' ? r : (STORE_ROLE_LEVEL[r] || 0))));
            if (req.storeLevel < minLevel) {
                audit.accessDenied({
                    userId: req.auth && req.auth.userId, role: req.storeRole,
                    scope: { type: 'store', id: req.storeId, countryCode: req.storeScope && req.storeScope.countryCode },
                    action: actionOf(req), reason: `requires_level_${minLevel}_has_${req.storeLevel}`, requestId: req.requestId,
                });
                return next(error('FORBIDDEN', 'Insufficient store permissions', 403));
            }
            return next();
        };
    }

    // Cross-store list scoping. Fail-closed: RBAC outage → denied (no scope = no data).
    async function loadAccessScope(req, res, next) {
        try {
            if (!req.auth) return next(error('UNAUTHORIZED', 'Authentication required', 401));
            req.accessScope = await scope.resolveAccessScope({ userId: req.auth.userId, token: bearer(req), jwtRoles: jwtRolesOf(req) });
            return next();
        } catch (err) {
            if (isUnreachable(err)) {
                if (failMode === 'open') { req.accessScope = { unrestricted: false, allowedCountries: [], allowedStoreIds: [] }; return next(); }
                return next(error('FORBIDDEN', 'Authorization service unavailable', 403));
            }
            return next(err);
        }
    }

    return { loadStoreRole, requireStoreRole, loadAccessScope };
}

module.exports = { createPep };
