'use strict';
/**
 * Trade Operations Dashboard — RBAC matrix (War Room 4, Prompt 3).
 *
 * PURE policy module (no DB, no req). Maps a caller's roles to a dashboard
 * capability set + visibility scope. The controller is the PEP (enforcement
 * point): it calls resolve() and then applies the returned scope as an extra
 * WHERE on top of the tenant isolation that the model hooks + DB RLS already
 * guarantee.
 *
 * Roles the shared dashboard understands (a caller may hold several):
 *   - admin       platform / tenant operator. Sees every operation in the
 *                 tenant; may comment. (super_admin / owner are admin-equivalent.)
 *   - logistics   carrier / freight operator. Sees every shipment in the tenant
 *                 (they physically move them all); may comment.
 *   - bank        trade financier. Sees every operation in the tenant
 *                 (financing exposure spans the book); read + comment, but may
 *                 NOT see internal-only documents (doc visibility handled in svc).
 *   - buyer       importer. Sees ONLY operations where it is the buyer party.
 *   - seller      exporter. Sees ONLY operations where it is the seller party.
 *
 * Anyone with none of these roles gets no dashboard access (fail-closed).
 *
 * `scope` semantics returned to the controller:
 *   - 'all'    → no party filter (tenant isolation still applies).
 *   - 'buyer'  → restrict to operations whose buyer_org_id ∈ caller party orgs.
 *   - 'seller' → restrict to operations whose seller_org_id ∈ caller party orgs.
 *   - 'party'  → buyer OR seller (caller holds both roles).
 *   - 'none'   → no access.
 */

const ADMIN_ROLES = Object.freeze(['admin', 'super_admin', 'owner']);
const ALL_SCOPE_ROLES = Object.freeze(['logistics', 'bank']); // tenant-wide read
const DASHBOARD_ROLES = Object.freeze(['admin', 'super_admin', 'owner', 'logistics', 'bank', 'buyer', 'seller']);

const intersects = (a, b) => a.some((x) => b.includes(x));

/**
 * @param {string[]} roles caller roles (e.g. req.auth.roles)
 * @returns {{ allowed:boolean, canComment:boolean, scope:'all'|'buyer'|'seller'|'party'|'none', isAdmin:boolean, reason?:string }}
 */
function resolve(roles = []) {
    const r = Array.isArray(roles) ? roles : [roles].filter(Boolean);

    if (intersects(r, ADMIN_ROLES)) {
        return { allowed: true, canComment: true, scope: 'all', isAdmin: true };
    }
    if (intersects(r, ALL_SCOPE_ROLES)) {
        // logistics + bank both get tenant-wide visibility and may comment.
        return { allowed: true, canComment: true, scope: 'all', isAdmin: false };
    }

    const isBuyer = r.includes('buyer');
    const isSeller = r.includes('seller');
    if (isBuyer && isSeller) {
        return { allowed: true, canComment: true, scope: 'party', isAdmin: false };
    }
    if (isBuyer) return { allowed: true, canComment: true, scope: 'buyer', isAdmin: false };
    if (isSeller) return { allowed: true, canComment: true, scope: 'seller', isAdmin: false };

    return { allowed: false, canComment: false, scope: 'none', isAdmin: false, reason: 'No dashboard role' };
}

/**
 * Whether `bank` callers should be denied a given document type. Banks see
 * financial / shipping docs but not internal compliance memos. Kept here so the
 * policy is unit-testable and centralised.
 */
const BANK_HIDDEN_DOC_TYPES = Object.freeze(['internal_memo', 'compliance_note', 'kyc_record']);
function canSeeDocument(access, docType) {
    if (access.isAdmin) return true;
    if (access.scope === 'all') {
        // logistics/bank: hide bank-restricted internal docs from non-admins.
        return !BANK_HIDDEN_DOC_TYPES.includes(docType);
    }
    return true; // buyer/seller see their own operation's docs
}


/**
 * Whether a trade operation falls inside the caller's party scope. Pure — the
 * caller supplies the operation row (or the buyer/seller org ids off it) and the
 * org identities the caller may act as.
 *
 * An operation-less subject is visible only to tenant-wide roles: without a
 * buyer/seller pair there is nothing to match a party against, and guessing
 * would be the wrong side of a fail-closed decision.
 */
function isOperationInScope(operation, access, partyOrgIds = []) {
    if (!operation) return access.scope === 'all'; // orphan subject: only tenant-wide roles
    if (access.scope === 'all') return true;
    const ids = (partyOrgIds || []).filter(Boolean);
    if (!ids.length) return false; // fail-closed
    if (access.scope === 'buyer') return ids.includes(operation.buyer_org_id);
    if (access.scope === 'seller') return ids.includes(operation.seller_org_id);
    if (access.scope === 'party') return ids.includes(operation.buyer_org_id) || ids.includes(operation.seller_org_id);
    return false;
}

module.exports = {
    resolve,
    canSeeDocument,
    isOperationInScope,
    ADMIN_ROLES,
    DASHBOARD_ROLES,
    BANK_HIDDEN_DOC_TYPES,
};
