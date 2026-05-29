'use strict';
// Canonical auth (Phase 3 Batch B): RS256-only verification via @baalvion/auth-node's
// One True Verifier. No local jwtserver, no legacy id/orgId/sessionId coercion.
const {
    createAuthMiddleware,
    requireRole: rbacRequireRole,
    requirePermission: rbacRequirePermission,
} = require('@baalvion/auth-node');
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

/**
 * Portal identity resolution.
 *
 * Baalvion auth makes every self-registered user an org "owner" with their own org, so the
 * auth token can't distinguish candidate/recruiter/admin and doesn't point at the employer org.
 * The jobs-service owns the portal role + the shared employer org, keyed by the user's EMAIL:
 *   - email in jobs.system_users  → that role (SUPER_ADMIN/ADMIN/RECRUITER/…) on the employer org
 *   - otherwise                   → CANDIDATE (their own application data, looked up by email)
 * For staff we override req.auth.orgId to the employer org so every existing org-scoped
 * controller operates on the right tenant unchanged.
 */
async function resolvePortal(req) {
    let email = null;
    try {
        const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        email = (jwt.decode(tok) || {}).email || null;
    } catch { /* ignore */ }

    req.portal = { role: 'CANDIDATE', email, candidateId: null, systemUserId: null, employerOrgId: req.auth.orgId };
    if (!email) return;

    const db = require('../models');
    const su = await db.SystemUser.findOne({ where: { email } });
    if (su) {
        req.portal.role = su.role;
        req.portal.systemUserId = su.id;
        req.portal.employerOrgId = su.org_id;
        req.auth.orgId = su.org_id; // staff operate on the employer tenant
    } else {
        const cand = await db.Candidate.findOne({ where: { email }, order: [['created_at', 'DESC']] });
        if (cand) req.portal.candidateId = cand.id;
    }
}

const authMiddleware = (req, res, next) => _canonical(req, res, async (err) => {
    if (err) return next(toAppError(err));
    try { await resolvePortal(req); } catch (e) { /* non-fatal — fall back to token context */ }
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles, role: req.portal && req.portal.role };
    return next();
});

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

// Portal-role gate (uses jobs-service portal roles, not raw auth roles).
const requirePortalRole = (...roles) => (req, res, next) => {
    const r = req.portal && req.portal.role;
    if (r && roles.includes(r)) return next();
    return next(new AppError('FORBIDDEN', 'Insufficient portal role', 403));
};

module.exports = { authMiddleware, requireRole, requirePermission, requirePortalRole };
