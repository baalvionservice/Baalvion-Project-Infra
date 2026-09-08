'use strict';
/**
 * CanWeMarry product roles.
 *
 * These are deliberately NOT the platform org roles in @baalvion/rbac
 * (viewer/member/editor/…/super_admin). That hierarchy models tenancy inside a
 * business organization; this one models standing inside a support community.
 * Keeping the vocabularies separate avoids role confusion — a platform admin of
 * some other Baalvion product is not, by that fact, a CanWeMarry moderator.
 *
 * A user holds a SET of roles. USER is implicit for every provisioned account.
 */

const ROLES = Object.freeze({
    USER: 'USER',
    SUPPORTER: 'SUPPORTER',
    VOLUNTEER: 'VOLUNTEER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

// Ascending trust. Used only for display ordering and for "at least" style checks;
// authorization itself is permission-based, never a level comparison.
const ROLE_ORDER = Object.freeze([ROLES.USER, ROLES.SUPPORTER, ROLES.VOLUNTEER, ROLES.MODERATOR, ROLES.ADMIN]);

// Roles a MODERATOR may grant. Escalation to MODERATOR/ADMIN is ADMIN-only.
const MODERATOR_GRANTABLE = Object.freeze([ROLES.SUPPORTER, ROLES.VOLUNTEER]);

const isRole = (r) => ALL_ROLES.includes(r);

/** Highest-ranked role in a set, for display. Returns USER when the set is empty. */
function primaryRole(roles = []) {
    let best = ROLES.USER;
    for (const r of roles) {
        if (isRole(r) && ROLE_ORDER.indexOf(r) > ROLE_ORDER.indexOf(best)) best = r;
    }
    return best;
}

const isStaff = (roles = []) => roles.includes(ROLES.MODERATOR) || roles.includes(ROLES.ADMIN);

module.exports = { ROLES, ALL_ROLES, ROLE_ORDER, MODERATOR_GRANTABLE, isRole, primaryRole, isStaff };
