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
 * trade.users is a legacy local-auth table that predates gateway-centralized identity
 * (auth-service now owns real accounts/passwords) and was never migrated away — it's
 * still the FK target for identity_verifications.user_id. Real sessions authenticate
 * entirely via the gateway's RS256 identity and have no row here, so a submission
 * would otherwise fail with a foreign-key violation. This provisions (once) a
 * trade.users row mirroring the gateway identity, keyed by the SAME integer id the
 * gateway issues, so no separate id-mapping table is needed. `password_hash` is
 * structurally required but meaningless here — auth is gateway-managed, not local.
 */
async function ensureTradeUserId(req) {
    const db = require('../../models');
    const raw = req.auth && req.auth.userId;
    if (!/^\d+$/.test(String(raw))) return null;
    const id = Number(raw);
    const email = (req.auth && req.auth.email) || `gateway-user-${id}@baalvion.local`;
    const [user] = await db.User.findOrCreate({
        where: { id },
        defaults: {
            id, email, password_hash: 'GATEWAY_MANAGED', full_name: email.split('@')[0],
            tenant_id: (req.auth && req.auth.tenantId) || 'T-DEMO',
        },
    });
    return user.id;
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

module.exports = { isAdmin, callerTenantId, actorOf, fetchOrgOwned, ensureTradeUserId };
