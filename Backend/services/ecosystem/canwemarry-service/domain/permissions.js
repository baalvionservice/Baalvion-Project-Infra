'use strict';
/**
 * The single source of truth for what each CanWeMarry role may do.
 *
 * Nothing outside this file decides authorization by inspecting a role name — routes
 * and services ask for a PERMISSION and the answer is computed here. That is what
 * makes the permission set auditable: to know who can review reports you read this
 * table, not thirty route handlers.
 *
 * Two kinds of check exist and they are not interchangeable:
 *   can(ctx, permission)  — does this role hold the capability AT ALL (a coarse gate)
 *   domain/visibility.js  — may this specific actor touch this specific record
 * A request that passes `can()` must still pass the record-level rules. Capability
 * without a record check is how private cases leak.
 */

const { ROLES } = require('./roles');

const PERMISSIONS = Object.freeze({
    CASE_CREATE: 'case:create',
    CASE_VIEW: 'case:view',
    CASE_UPDATE: 'case:update',
    CASE_DELETE: 'case:delete',
    CASE_SUPPORT: 'case:support',
    CASE_REPORT: 'case:report',
    CASE_MODERATE: 'case:moderate',

    COMMUNITY_CREATE: 'community:create',
    COMMUNITY_JOIN: 'community:join',
    COMMUNITY_MODERATE: 'community:moderate',

    POST_CREATE: 'post:create',
    POST_MODERATE: 'post:moderate',
    COMMENT_CREATE: 'comment:create',
    COMMENT_MODERATE: 'comment:moderate',
    REACTION_CREATE: 'reaction:create',

    PROFILE_UPDATE_SELF: 'profile:update_self',
    NOTIFICATION_READ_SELF: 'notification:read_self',

    RESOURCE_VIEW: 'resource:view',
    RESOURCE_MANAGE: 'resource:manage',

    REPORT_CREATE: 'report:create',
    REPORT_REVIEW: 'report:review',

    // Conferring the two community-helper roles. Which roles a holder may actually
    // grant is narrowed again in userService.grantRole — a moderator cannot promote
    // anyone to MODERATOR or ADMIN, so the moderation tier cannot enlarge itself.
    USER_ROLE_GRANT: 'user:role_grant',

    ADMIN_USERS: 'admin:users',
    ADMIN_CASES: 'admin:cases',
    ADMIN_REPORTS: 'admin:reports',
    ADMIN_MODERATION: 'admin:moderation',
    ADMIN_AUDIT: 'admin:audit',
});

// Anyone, including an unauthenticated visitor. Record-level rules still apply — an
// anonymous caller holding CASE_VIEW can still only reach cases whose visibility is PUBLIC.
const ANONYMOUS_PERMISSIONS = Object.freeze([
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.RESOURCE_VIEW,
]);

const USER_PERMISSIONS = Object.freeze([
    ...ANONYMOUS_PERMISSIONS,
    PERMISSIONS.CASE_CREATE,
    PERMISSIONS.CASE_UPDATE,
    PERMISSIONS.CASE_DELETE,
    PERMISSIONS.CASE_REPORT,
    PERMISSIONS.COMMUNITY_JOIN,
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.REACTION_CREATE,
    PERMISSIONS.PROFILE_UPDATE_SELF,
    PERMISSIONS.NOTIFICATION_READ_SELF,
    PERMISSIONS.REPORT_CREATE,
]);

// Additive: each role's grants are its own PLUS everything the roles below it hold.
const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.USER]: USER_PERMISSIONS,

    // A supporter has offered to stand with people through a case. The capability is
    // only the ability to ASK; the case owner still has to accept (see supportService).
    [ROLES.SUPPORTER]: Object.freeze([...USER_PERMISSIONS, PERMISSIONS.CASE_SUPPORT]),

    // Volunteers are vetted community helpers — mediators, counsellors, legal advisers.
    // They curate the resource directory. They get no moderation powers over people.
    [ROLES.VOLUNTEER]: Object.freeze([
        ...USER_PERMISSIONS,
        PERMISSIONS.CASE_SUPPORT,
        PERMISSIONS.COMMUNITY_CREATE,
        PERMISSIONS.RESOURCE_MANAGE,
    ]),

    [ROLES.MODERATOR]: Object.freeze([
        ...USER_PERMISSIONS,
        PERMISSIONS.CASE_SUPPORT,
        PERMISSIONS.COMMUNITY_CREATE,
        PERMISSIONS.RESOURCE_MANAGE,
        PERMISSIONS.CASE_MODERATE,
        PERMISSIONS.COMMUNITY_MODERATE,
        PERMISSIONS.POST_MODERATE,
        PERMISSIONS.COMMENT_MODERATE,
        PERMISSIONS.REPORT_REVIEW,
        PERMISSIONS.USER_ROLE_GRANT,
        PERMISSIONS.ADMIN_REPORTS,
        PERMISSIONS.ADMIN_MODERATION,
    ]),

    [ROLES.ADMIN]: Object.freeze(Object.values(PERMISSIONS)),
});

/**
 * The permission set for a role list. An empty/absent list is treated as anonymous,
 * NOT as USER — an unauthenticated caller must never inherit member capabilities.
 */
function permissionsFor(roles) {
    if (!Array.isArray(roles) || roles.length === 0) return new Set(ANONYMOUS_PERMISSIONS);
    const set = new Set();
    for (const role of roles) {
        for (const p of ROLE_PERMISSIONS[role] || []) set.add(p);
    }
    // A provisioned account always carries at least the baseline member capabilities.
    for (const p of USER_PERMISSIONS) set.add(p);
    return set;
}

/**
 * @param {{ userId?: string|null, roles?: string[] }} actor
 * @param {string} permission
 */
function can(actor, permission) {
    if (!actor || !actor.userId) return ANONYMOUS_PERMISSIONS.includes(permission);
    return permissionsFor(actor.roles).has(permission);
}

const canAny = (actor, permissions) => permissions.some((p) => can(actor, p));
const canAll = (actor, permissions) => permissions.every((p) => can(actor, p));

module.exports = {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    ANONYMOUS_PERMISSIONS,
    permissionsFor,
    can,
    canAny,
    canAll,
};
