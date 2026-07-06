'use strict';
// Shared auth/ownership helpers for the Phase 2 verification controllers
// (identity/company/tax/bank/address/facility/product/compliance/fraud/risk/
// trust-score/reputation/review-console). Every one of those controllers needs the
// same "does this org belong to the caller's tenant" check, so it lives here once
// instead of being copy-pasted 15 times. Mirrors the isAdmin/callerTenantId/
// fetchDocumentOwned pattern established in tradeDocumentController.js.
const db = require('../../models');
const { AppError } = require('../../utils/errors');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || (req.auth && req.auth.role ? [req.auth.role] : []);
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner' || r === 'operator' || r === 'reviewer');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || req.tenantId || null;
}

function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}

/**
 * Load an organization and enforce tenant ownership. Returns null (and calls
 * `next` with a 404 — never 403, to avoid existence leaks) when the org doesn't
 * exist or belongs to another tenant, unless the caller is an admin/reviewer.
 */
async function fetchOrgOwned(orgId, req, next) {
    if (!Number.isInteger(orgId)) { next(new AppError('NOT_FOUND', 'Organization not found', 404)); return null; }
    const org = await db.Organization.findByPk(orgId);
    if (!org) { next(new AppError('NOT_FOUND', 'Organization not found', 404)); return null; }
    if (isAdmin(req)) return org;
    const tenantId = callerTenantId(req);
    if (tenantId && org.tenant_id && org.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Organization not found', 404)); return null;
    }
    return org;
}

module.exports = { isAdmin, callerTenantId, actorOf, fetchOrgOwned };
