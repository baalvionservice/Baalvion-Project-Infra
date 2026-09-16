'use strict';
/**
 * Who the caller is AS A TRADE PARTY (buyer / seller), as opposed to who they
 * are as a gateway user.
 *
 * These are two different identities and the gap between them is why the
 * party-scoped surfaces were unreachable:
 *
 *   • Trade operations name their parties by trade-domain ORG CODE
 *     (`trade.organizations.code`, e.g. 'COMP-101'), not by the gateway org
 *     UUID that arrives on `req.auth.orgId`.
 *   • Whether an org buys or sells is a property of the ORGANIZATION
 *     (`trade.organizations.type`), not a role on the user's token — the
 *     gateway issues membership roles (owner / admin / member), so
 *     `rbac.resolve` looking for a literal 'buyer' role never matched one.
 *
 * So authMiddleware pinned `orgCode: null` and tenantContext.js noted
 * "participant scoping is a follow-up". This module is that follow-up: it
 * resolves the caller's organization once per request (Redis-cached), folds the
 * org's type into the role set, and hands back both the access scope and the
 * identifiers a trade operation can actually be matched on.
 *
 * Fail-closed: an unresolvable organization contributes no party identity, which
 * leaves a non-admin caller matching nothing rather than matching everything.
 */
const db = require('../../models');
const cache = require('../../cache');
const rbac = require('./rbac');

const ORG_TTL_SECONDS = 300;

// An organization's type implies what it does on a trade. 'carrier' moves every
// shipment in the tenant and 'bank' finances the book, which is what rbac already
// calls tenant-wide; buyer/seller are party-scoped.
const ORG_TYPE_TO_ROLE = Object.freeze({
    buyer: 'buyer',
    seller: 'seller',
    carrier: 'logistics',
    bank: 'bank',
});

/**
 * The trade organization behind a gateway org/tenant id. `organizations.tenant_id`
 * carries the gateway org id, so that is the join. Returns null when the tenant
 * maps to no org, or to more than one — an ambiguous mapping must not silently
 * pick a side.
 */
async function organizationForTenant(tenantId) {
    if (!tenantId) return null;
    return cache.wrap(`baalvion:${tenantId}:party-identity:org`, ORG_TTL_SECONDS, async () => {
        const rows = await db.Organization.findAll({
            where: { tenant_id: tenantId },
            attributes: ['id', 'code', 'type', 'name'],
            limit: 2,
        });
        if (rows.length !== 1) return null;
        const org = rows[0];
        return { id: org.id, code: org.code || null, type: org.type || null, name: org.name || null };
    });
}

/**
 * Resolve the caller's dashboard/ledger access and their party identifiers.
 *
 * @returns {{ access: object, partyOrgIds: string[], organization: object|null }}
 */
async function resolveParty(req) {
    const auth = (req && req.auth) || {};
    const tokenRoles = Array.isArray(auth.roles) ? auth.roles : [];

    // Admins short-circuit: they are tenant-wide by role and never need a party
    // identity, so don't pay for the lookup.
    if (rbac.resolve(tokenRoles).scope === 'all') {
        return { access: rbac.resolve(tokenRoles), partyOrgIds: [], organization: null };
    }

    const organization = await organizationForTenant(auth.orgId || auth.tenantId);
    const orgRole = organization && ORG_TYPE_TO_ROLE[organization.type];
    const roles = orgRole ? [...tokenRoles, orgRole] : tokenRoles;

    const partyOrgIds = [...new Set([
        organization && organization.code,
        auth.orgCode,
        auth.orgId,
    ].filter(Boolean))];

    return { access: rbac.resolve(roles), partyOrgIds, organization };
}

module.exports = { resolveParty, organizationForTenant, ORG_TYPE_TO_ROLE };
