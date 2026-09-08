'use strict';
const { PERMISSIONS, can, permissionsFor, ANONYMOUS_PERMISSIONS } = require('../domain/permissions');
const { ROLES, primaryRole, isStaff } = require('../domain/roles');

const actor = (roles) => ({ userId: 'u1', roles });
const anon = { userId: null, roles: [] };

describe('permission catalog', () => {
    test('an anonymous caller holds only the read capabilities', () => {
        expect(can(anon, PERMISSIONS.CASE_VIEW)).toBe(true);
        expect(can(anon, PERMISSIONS.RESOURCE_VIEW)).toBe(true);
        expect(can(anon, PERMISSIONS.CASE_CREATE)).toBe(false);
        expect(can(anon, PERMISSIONS.COMMENT_CREATE)).toBe(false);
        expect(can(anon, PERMISSIONS.REPORT_CREATE)).toBe(false);
    });

    test('an empty role list is treated as anonymous, not as USER', () => {
        // Guards the failure where a token with no roles claim silently gains member rights.
        expect(permissionsFor([])).toEqual(new Set(ANONYMOUS_PERMISSIONS));
    });

    test('a plain member can open and report cases but cannot moderate', () => {
        const a = actor([ROLES.USER]);
        expect(can(a, PERMISSIONS.CASE_CREATE)).toBe(true);
        expect(can(a, PERMISSIONS.REPORT_CREATE)).toBe(true);
        expect(can(a, PERMISSIONS.CASE_MODERATE)).toBe(false);
        expect(can(a, PERMISSIONS.REPORT_REVIEW)).toBe(false);
        expect(can(a, PERMISSIONS.ADMIN_USERS)).toBe(false);
    });

    test('offering support requires the SUPPORTER capability', () => {
        expect(can(actor([ROLES.USER]), PERMISSIONS.CASE_SUPPORT)).toBe(false);
        expect(can(actor([ROLES.SUPPORTER]), PERMISSIONS.CASE_SUPPORT)).toBe(true);
    });

    test('volunteers curate resources but hold no power over people', () => {
        const v = actor([ROLES.VOLUNTEER]);
        expect(can(v, PERMISSIONS.RESOURCE_MANAGE)).toBe(true);
        expect(can(v, PERMISSIONS.CASE_MODERATE)).toBe(false);
        expect(can(v, PERMISSIONS.REPORT_REVIEW)).toBe(false);
        expect(can(v, PERMISSIONS.ADMIN_MODERATION)).toBe(false);
    });

    test('a moderator reviews reports but cannot reach the user admin or audit surfaces', () => {
        const m = actor([ROLES.MODERATOR]);
        expect(can(m, PERMISSIONS.REPORT_REVIEW)).toBe(true);
        expect(can(m, PERMISSIONS.CASE_MODERATE)).toBe(true);
        expect(can(m, PERMISSIONS.USER_ROLE_GRANT)).toBe(true);
        expect(can(m, PERMISSIONS.ADMIN_USERS)).toBe(false);
        expect(can(m, PERMISSIONS.ADMIN_AUDIT)).toBe(false);
    });

    test('an admin holds every declared permission', () => {
        const a = actor([ROLES.ADMIN]);
        for (const p of Object.values(PERMISSIONS)) expect(can(a, p)).toBe(true);
    });

    test('roles are additive across a set', () => {
        const a = actor([ROLES.USER, ROLES.VOLUNTEER]);
        expect(can(a, PERMISSIONS.RESOURCE_MANAGE)).toBe(true);
        expect(can(a, PERMISSIONS.CASE_CREATE)).toBe(true);
    });

    test('an unknown role confers nothing beyond the member baseline', () => {
        const a = actor(['SUPERUSER']);
        expect(can(a, PERMISSIONS.ADMIN_USERS)).toBe(false);
        expect(can(a, PERMISSIONS.CASE_MODERATE)).toBe(false);
        expect(can(a, PERMISSIONS.CASE_CREATE)).toBe(true);
    });
});

describe('role helpers', () => {
    test('primaryRole picks the highest-ranked role held', () => {
        expect(primaryRole([ROLES.USER, ROLES.MODERATOR, ROLES.SUPPORTER])).toBe(ROLES.MODERATOR);
        expect(primaryRole([])).toBe(ROLES.USER);
    });

    test('isStaff covers moderators and admins only', () => {
        expect(isStaff([ROLES.MODERATOR])).toBe(true);
        expect(isStaff([ROLES.ADMIN])).toBe(true);
        expect(isStaff([ROLES.VOLUNTEER, ROLES.SUPPORTER])).toBe(false);
    });
});
