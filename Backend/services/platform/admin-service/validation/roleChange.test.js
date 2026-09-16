'use strict';
/**
 * Guards on changing a person's ORG role — the role the access token actually carries.
 *
 * Context (2026-09-05): the console's Permissions screen wrote to `staff.employees.role`,
 * which nothing in the authorization path reads, so changing someone's role from the admin
 * panel silently did nothing. Adding a REAL role change means adding the operation most
 * capable of privilege escalation in the whole system, so its rules are pinned here.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRoleChange, ORG_ROLE_RANK } = require('../service/adminService');

const ALLOWED = null;
const check = (o) => checkRoleChange({ superAdminCount: Infinity, ...o });
const denial = (o) => { const e = check(o); return e ? { status: e.statusCode ?? e.status, message: e.message } : null; };

// ── rank ordering ────────────────────────────────────────────────────────────
test('the rank ladder is strictly ordered', () => {
    const order = ['viewer', 'member', 'editor', 'manager', 'admin', 'owner', 'super_admin'];
    for (let i = 1; i < order.length; i += 1) {
        assert.ok(ORG_ROLE_RANK[order[i]] > ORG_ROLE_RANK[order[i - 1]], `${order[i]} must outrank ${order[i - 1]}`);
    }
});

// ── escalation ───────────────────────────────────────────────────────────────
test('you cannot grant a role higher than your own', () => {
    const d = denial({ actorId: 1, actorRoles: ['admin'], targetId: 2, previousRole: 'viewer', newRole: 'super_admin' });
    assert.equal(d.status, 403);
    assert.match(d.message, /higher than your own/);
});

test('an admin cannot mint an owner either', () => {
    assert.ok(check({ actorId: 1, actorRoles: ['admin'], targetId: 2, previousRole: 'viewer', newRole: 'owner' }));
});

test('granting your own rank is allowed', () => {
    assert.equal(check({ actorId: 1, actorRoles: ['admin'], targetId: 2, previousRole: 'viewer', newRole: 'admin' }), ALLOWED);
});

test('you cannot change your own role — no self-promotion, no self-lockout', () => {
    const d = denial({ actorId: 7, actorRoles: ['super_admin'], targetId: 7, previousRole: 'super_admin', newRole: 'viewer' });
    assert.equal(d.status, 403);
    assert.match(d.message, /your own role/);
});

test('the self check compares loosely — a string id must not slip past a numeric one', () => {
    assert.ok(check({ actorId: 7, actorRoles: ['super_admin'], targetId: '7', previousRole: 'admin', newRole: 'viewer' }));
});

test('you cannot change the role of someone who outranks you', () => {
    const d = denial({ actorId: 1, actorRoles: ['admin'], targetId: 2, previousRole: 'owner', newRole: 'viewer' });
    assert.equal(d.status, 403);
    assert.match(d.message, /above you/);
});

test('a super_admin may demote an owner', () => {
    assert.equal(check({ actorId: 1, actorRoles: ['super_admin'], targetId: 2, previousRole: 'owner', newRole: 'member' }), ALLOWED);
});

// ── the last super_admin ─────────────────────────────────────────────────────
test('the last super_admin cannot be demoted', () => {
    const d = denial({ actorId: 1, actorRoles: ['super_admin'], targetId: 2, previousRole: 'super_admin', newRole: 'admin', superAdminCount: 1 });
    assert.equal(d.status, 409);
    assert.match(d.message, /last super admin/i);
});

test('a super_admin can be demoted while another remains', () => {
    assert.equal(
        check({ actorId: 1, actorRoles: ['super_admin'], targetId: 2, previousRole: 'super_admin', newRole: 'admin', superAdminCount: 2 }),
        ALLOWED,
    );
});

test('re-granting super_admin to a super_admin is not blocked by the last-admin rule', () => {
    assert.equal(
        check({ actorId: 1, actorRoles: ['super_admin'], targetId: 2, previousRole: 'super_admin', newRole: 'super_admin', superAdminCount: 1 }),
        ALLOWED,
    );
});

// ── unknown input ────────────────────────────────────────────────────────────
test('an unknown role is rejected rather than silently ranked', () => {
    const d = denial({ actorId: 1, actorRoles: ['super_admin'], targetId: 2, previousRole: 'viewer', newRole: 'wizard' });
    assert.equal(d.status, 422);
});

test('an actor with no recognised role can grant nothing', () => {
    assert.ok(check({ actorId: 1, actorRoles: [], targetId: 2, previousRole: 'viewer', newRole: 'viewer' }));
    assert.ok(check({ actorId: 1, actorRoles: ['not_a_role'], targetId: 2, previousRole: 'viewer', newRole: 'viewer' }));
});

test('a multi-role actor is judged on their HIGHEST role', () => {
    assert.equal(
        check({ actorId: 1, actorRoles: ['viewer', 'super_admin'], targetId: 2, previousRole: 'owner', newRole: 'admin' }),
        ALLOWED,
    );
});
