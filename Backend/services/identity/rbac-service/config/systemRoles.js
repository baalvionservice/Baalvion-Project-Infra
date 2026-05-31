'use strict';
/**
 * Canonical RBAC scope + role taxonomy — the single source of truth shared by
 * the seed script, the hierarchy logic and the authorization guards.
 *
 * Tenant scopes form a tree:  platform ─► country ─► organization ─► (end user)
 *
 * The four SYSTEM roles map onto that tree. `level` is the hierarchy rank
 * (higher = more privileged); a caller's HIGHEST applicable role wins, and
 * super_admin satisfies every check. `parent` encodes inheritance: each role
 * inherits everything below it.
 *
 *   super_admin (400, platform)
 *      └─ country_admin (300, country)
 *            └─ organization_admin (200, organization)
 *                  └─ end_user (100, organization)
 *
 * Each tenant owns its OWN role rows (multi-tenant: separate roles per tenant).
 * These definitions are the templates instantiated for the platform tenant and
 * the defaults proposed when a country/organization tenant is provisioned.
 */

const SCOPE = Object.freeze({
    PLATFORM:     'platform',
    COUNTRY:      'country',
    ORGANIZATION: 'organization',
});

// Hierarchy ranks. Custom roles created via the API slot BETWEEN these bands.
const LEVEL = Object.freeze({
    END_USER:          100,
    ORGANIZATION_ADMIN: 200,
    COUNTRY_ADMIN:      300,
    SUPER_ADMIN:        400,
});

const ROLE_KEY = Object.freeze({
    SUPER_ADMIN:        'super_admin',
    COUNTRY_ADMIN:      'country_admin',
    ORGANIZATION_ADMIN: 'organization_admin',
    END_USER:           'end_user',
});

/**
 * Ordered most-privileged → least. Each entry carries the scope it governs, its
 * hierarchy level, and the key of the role it inherits from (`parent`).
 */
const SYSTEM_ROLES = [
    {
        key:         ROLE_KEY.SUPER_ADMIN,
        name:        'Super Admin',
        scope:       SCOPE.PLATFORM,
        level:       LEVEL.SUPER_ADMIN,
        parent:      ROLE_KEY.COUNTRY_ADMIN,
        description: 'Platform-wide control. Governs every country, organization and user across all tenants.',
    },
    {
        key:         ROLE_KEY.COUNTRY_ADMIN,
        name:        'Country Admin',
        scope:       SCOPE.COUNTRY,
        level:       LEVEL.COUNTRY_ADMIN,
        parent:      ROLE_KEY.ORGANIZATION_ADMIN,
        description: 'Administers all organizations and users within a single country tenant.',
    },
    {
        key:         ROLE_KEY.ORGANIZATION_ADMIN,
        name:        'Organization Admin',
        scope:       SCOPE.ORGANIZATION,
        level:       LEVEL.ORGANIZATION_ADMIN,
        parent:      ROLE_KEY.END_USER,
        description: 'Administers a single organization tenant: its members, roles and resources.',
    },
    {
        key:         ROLE_KEY.END_USER,
        name:        'End User',
        scope:       SCOPE.ORGANIZATION,
        level:       LEVEL.END_USER,
        parent:      null,
        description: 'Standard member. Baseline access scoped to their own organization.',
    },
];

const SCOPES = Object.values(SCOPE);
const TENANT_TYPES = SCOPES; // tenant.type uses the same vocabulary as role scope

module.exports = { SCOPE, SCOPES, TENANT_TYPES, LEVEL, ROLE_KEY, SYSTEM_ROLES };
