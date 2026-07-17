'use strict';
// Canonical auth: RS256-only verification via @baalvion/auth-node's One True Verifier.
// No local jwtserver, no legacy id/orgId/sessionId coercion — see RBAC.md.
// jwt.decode() below reads the email claim ONLY (never verifies) — verification already
// happened via createAuthMiddleware above it. Same carve-out as jobs-service's
// authMiddleware.js (see Backend/catalog/enforce.mjs's JWT_ALLOWLIST).
const { createAuthMiddleware, requireRole: rbacRequireRole, requirePermission: rbacRequirePermission } = require('@baalvion/auth-node');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

const _canonical = createAuthMiddleware({
    jwksUri:         config.jwt.jwksUri || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

// Platform super-admins bypass per-community checks entirely — mirrors jobs-service's
// PLATFORM_ADMIN_ROLES bypass, used only for the central admin console, never for
// deciding whether a regular user may read/post in a community (that's membership-driven).
const PLATFORM_ADMIN_ROLES = new Set(['super_admin', 'platform_admin']);

function isPlatformAdmin(req) {
    const roles = Array.isArray(req.auth && req.auth.roles) ? req.auth.roles : [];
    return roles.some((r) => PLATFORM_ADMIN_ROLES.has(String(r).toLowerCase()));
}

const ROLE_RANK = { member: 1, moderator: 2, admin: 3 };

// Loads every community_memberships row for the caller into req.communityRoles, keyed by
// community slug. Resolved fresh per-request (not embedded in the JWT) since membership
// changes independently of token lifetime.
async function resolveCommunityRoles(req) {
    req.communityRoles = {};
    req.isPlatformAdmin = isPlatformAdmin(req);
    const db = require('../models');
    const rows = await db.CommunityMembership.findAll({
        where: { user_id: req.auth.userId },
        include: [{ model: db.Community, as: 'community', attributes: ['slug'] }],
    });
    for (const row of rows) {
        if (!row.community) continue;
        req.communityRoles[row.community.slug] = { role: row.role, status: row.status, tier: row.tier };
    }
}

const authMiddleware = (req, res, next) => _canonical(req, res, async (err) => {
    if (err) return next(toAppError(err));
    try { await resolveCommunityRoles(req); } catch (e) { req.communityRoles = {}; }
    return next();
});

// Optional auth: attaches req.auth/req.communityRoles when a valid token is present,
// but never rejects the request — used for public reads that personalize when logged in.
const optionalAuthMiddleware = (req, res, next) => {
    if (!req.headers.authorization) { req.communityRoles = {}; return next(); }
    return authMiddleware(req, res, next);
};

// Route-level community role gate. slugParam names the :param holding the community slug.
const requireCommunityRole = (minRole, slugParam = 'slug') => (req, res, next) => {
    if (req.isPlatformAdmin) return next();
    const slug = req.params[slugParam];
    const membership = req.communityRoles && req.communityRoles[slug];
    const have = membership ? ROLE_RANK[membership.role] || 0 : 0;
    const need = ROLE_RANK[minRole] || 0;
    if (have >= need && membership.status !== 'banned') return next();
    return next(new AppError('FORBIDDEN', 'Insufficient community role', 403));
};

const requirePlatformAdmin = (req, res, next) => {
    if (req.isPlatformAdmin) return next();
    return next(new AppError('FORBIDDEN', 'Platform admin required', 403));
};

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

// Best-effort email extraction from the caller's own already-verified bearer token — used
// for self-service actions (join/redeemInvite) where the DB has no email of its own to
// look up. Not a verification path (that already happened above).
function decodeEmailFromRequest(req) {
    try {
        const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        return (jwt.decode(tok) || {}).email || null;
    } catch {
        return null;
    }
}

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    requireCommunityRole,
    requirePlatformAdmin,
    requireRole,
    requirePermission,
    decodeEmailFromRequest,
};
