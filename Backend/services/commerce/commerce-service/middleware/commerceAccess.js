'use strict';
const { CommerceStoreMember } = require('../models');
const { AppError } = require('../utils/errors');

const STORE_ROLE_LEVEL = { store_admin: 100, commerce_manager: 80, inventory_manager: 60, fulfillment_manager: 50, seo_manager: 50, content_editor: 40, support_agent: 30, reviewer: 20 };
const PLATFORM_BYPASS = ['super_admin', 'owner', 'admin'];

// Canonical STORE_CONTEXT_RESOLVER (additive, backward compatible):
//   JWT store_id (preferred) → X-Store-ID header → path param → body → query.
// Behind Traefik every request shares Host api.baalvion.com, so subdomain resolution is a
// frontend concern and intentionally omitted here. DB membership stays the authority.
const resolveStoreId = (req) => {
    const fromJwt    = req.auth && (req.auth.store_id || req.auth.storeId);
    const fromHeader = typeof req.get === 'function' ? req.get('X-Store-ID') : undefined;
    return fromJwt || fromHeader || (req.params && req.params.storeId)
        || (req.body && req.body.storeId) || (req.query && req.query.storeId) || null;
};

const loadStoreRole = async (req, res, next) => {
    try {
        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        const storeId = resolveStoreId(req);
        // If the token is store-scoped, it must match the addressed store — no cross-store access.
        const tokenStore = req.auth.store_id || req.auth.storeId;
        if (tokenStore && req.params && req.params.storeId && tokenStore !== req.params.storeId) {
            return next(new AppError('FORBIDDEN', 'Token store context does not match requested store', 403));
        }
        // Canonical roles[] (Phase 3); scalar role fallback for the migration window.
        const callerRoles = Array.isArray(req.auth.roles) ? req.auth.roles : (req.auth.role != null ? [req.auth.role] : []);
        if (callerRoles.some((r) => PLATFORM_BYPASS.includes(r))) { req.storeRole = 'store_admin'; req.storeLevel = 100; req.storeId = storeId; return next(); }
        if (!storeId) return next(new AppError('BAD_REQUEST', 'storeId is required', 400));
        const member = await CommerceStoreMember.findOne({ where: { storeId, userId: req.auth.userId } });
        if (!member) return next(new AppError('FORBIDDEN', 'You are not a member of this store', 403));
        req.storeRole = member.role; req.storeLevel = STORE_ROLE_LEVEL[member.role] || 0; req.storeId = storeId;
        return next();
    } catch (err) { return next(err); }
};

const requireStoreRole = (...minRoles) => (req, res, next) => {
    if (req.storeLevel === undefined) return next(new AppError('FORBIDDEN', 'Store access not verified', 403));
    const minLevel = Math.min(...minRoles.map(r => typeof r === 'number' ? r : (STORE_ROLE_LEVEL[r] || 0)));
    if (req.storeLevel < minLevel) return next(new AppError('FORBIDDEN', 'Insufficient store permissions', 403));
    return next();
};

module.exports = { loadStoreRole, requireStoreRole, STORE_ROLE_LEVEL };
