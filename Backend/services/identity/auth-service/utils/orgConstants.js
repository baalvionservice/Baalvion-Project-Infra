'use strict';
/**
 * Single source of truth for the multi-tenant trade-network taxonomy.
 * Mirrors the frontend src/core/organizations.ts. Keep the two in sync.
 */

// Trade-network organization types. Dashboard access on the frontend is resolved from
// (orgType, role) — see migration 004 + frontend core/organizations.ts.
const ORG_TYPES = Object.freeze([
    'buyer',
    'seller',
    'trade_agent',
    'logistics_provider',
    'customs_authority',
    'bank',
    'insurance_provider',
    'compliance_agency',
    'regulator',
    'platform_owner',
]);

// The 7-tier membership capability model. Higher tiers are strict supersets of lower ones.
//   owner    — full control incl. org settings + ownership transfer
//   admin    — manage users + operate, cannot delete the org / transfer ownership
//   manager  — operate + approve, cannot manage users
//   officer  — operate + approve (functional authority, e.g. compliance officer)
//   analyst  — read-only analytics
//   operator — operate (create/edit), cannot approve
//   viewer   — read-only
const MEMBERSHIP_ROLES = Object.freeze([
    'owner', 'admin', 'manager', 'officer', 'analyst', 'operator', 'viewer',
]);

const ORG_TYPE_SET = new Set(ORG_TYPES);
const ROLE_SET = new Set(MEMBERSHIP_ROLES);

// 'pending'  — created by the public onboarding intake, awaiting platform review.
// 'rejected' — application declined; access never granted.
const ORG_STATUSES = Object.freeze(['active', 'suspended', 'pending', 'rejected']);

function isValidOrgType(value) {
    return ORG_TYPE_SET.has(value);
}

function isValidRole(value) {
    return ROLE_SET.has(value);
}

// Capability matrix — mirrors frontend ROLE_CAPABILITIES.
const ROLE_CAPABILITIES = Object.freeze({
    owner: { view: true, edit: true, approve: true, manageUsers: true, manageOrganization: true },
    admin: { view: true, edit: true, approve: true, manageUsers: true, manageOrganization: false },
    manager: { view: true, edit: true, approve: true, manageUsers: false, manageOrganization: false },
    officer: { view: true, edit: true, approve: true, manageUsers: false, manageOrganization: false },
    operator: { view: true, edit: true, approve: false, manageUsers: false, manageOrganization: false },
    analyst: { view: true, edit: false, approve: false, manageUsers: false, manageOrganization: false },
    viewer: { view: true, edit: false, approve: false, manageUsers: false, manageOrganization: false },
});

function canManageUsers(role) {
    return !!(ROLE_CAPABILITIES[role] && ROLE_CAPABILITIES[role].manageUsers);
}

function canManageOrganization(role) {
    return !!(ROLE_CAPABILITIES[role] && ROLE_CAPABILITIES[role].manageOrganization);
}

module.exports = {
    ORG_TYPES,
    MEMBERSHIP_ROLES,
    ORG_STATUSES,
    ORG_TYPE_SET,
    ROLE_SET,
    ROLE_CAPABILITIES,
    isValidOrgType,
    isValidRole,
    canManageUsers,
    canManageOrganization,
};
