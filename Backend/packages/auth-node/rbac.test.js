'use strict';
/**
 * RBAC guard tests. Run: node --test  (from Backend/packages/auth-node)
 *
 * Written after a real incident on 2026-09-05: admin-service was moved from
 * requireSuperAdmin to requireRole('admin') to give the `admin` tier real power. Because
 * requireRole is HIERARCHICAL it also admitted `owner` — and registration makes every
 * signed-up user the owner of their own organization. A freshly registered account could
 * read the platform user list before it was caught.
 *
 * The escalation cases below are the regression guard for that. If someone swaps
 * requireStaffAdmin back to requireRole('admin'), these fail.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  ROLE_HIERARCHY,
  FUNCTIONAL_ROLE_TIER,
  roleLevel,
  isRoleAtLeast,
  hasPermission,
  requireRole,
  requireExactRole,
  requireStaffAdmin,
  requireSuperAdmin,
  assertNoRoleConfusion,
  isPlatformRole,
} = require('./rbac.js');

/** Minimal express double: returns the error passed to next(), or null when allowed. */
const runGuard = (guard, roles, permissions = []) => {
  let outcome = null;
  guard({ auth: { roles, permissions } }, {}, (err) => { outcome = err || null; });
  return outcome;
};
const allows = (guard, roles, permissions) => runGuard(guard, roles, permissions) === null;

// ── hierarchy ────────────────────────────────────────────────────────────────
test('hierarchy levels are the array index and stay in order', () => {
  ROLE_HIERARCHY.forEach((role, i) => assert.equal(roleLevel(role), i));
  assert.ok(roleLevel('super_admin') > roleLevel('owner'));
  assert.ok(roleLevel('owner') > roleLevel('admin'));
});

test('an unknown role scores -1 and never satisfies a requirement', () => {
  assert.equal(roleLevel('not_a_real_role'), -1);
  assert.equal(isRoleAtLeast(['not_a_real_role'], 'viewer'), false);
});

test('functional roles resolve to their tier instead of -1', () => {
  for (const [role, tier] of Object.entries(FUNCTIONAL_ROLE_TIER)) {
    assert.notEqual(roleLevel(role), -1, `${role} must not be unmapped`);
    assert.equal(roleLevel(role), roleLevel(tier), `${role} should sit at ${tier}`);
  }
});

test('mapping functional roles did not renumber the hierarchy', () => {
  assert.equal(roleLevel('viewer'), 0);
  assert.equal(roleLevel('super_admin'), ROLE_HIERARCHY.length - 1);
});

// ── requireRole: hierarchical by design ──────────────────────────────────────
test('requireRole is hierarchical — a higher tier satisfies a lower requirement', () => {
  assert.equal(allows(requireRole('admin'), ['owner']), true);
  assert.equal(allows(requireRole('admin'), ['super_admin']), true);
  assert.equal(allows(requireRole('admin'), ['manager']), false);
});

// ── THE ESCALATION REGRESSION ────────────────────────────────────────────────
test('ESCALATION: requireRole("admin") admits owner — why staff surfaces must not use it', () => {
  // Documents the trap rather than asserting it is safe: `owner` is self-service.
  assert.equal(allows(requireRole('admin'), ['owner']), true);
});

test('ESCALATION: requireStaffAdmin REJECTS a self-service owner', () => {
  assert.equal(allows(requireStaffAdmin, ['owner']), false,
    'a registered user (owner of their own org) must never reach staff surfaces');
});

test('requireStaffAdmin admits exactly admin and super_admin', () => {
  assert.equal(allows(requireStaffAdmin, ['admin']), true);
  assert.equal(allows(requireStaffAdmin, ['super_admin']), true);
  for (const role of ['owner', 'manager', 'editor', 'member', 'viewer', 'finance', 'support']) {
    assert.equal(allows(requireStaffAdmin, [role]), false, `${role} must be rejected`);
  }
});

test('requireExactRole ignores the hierarchy in both directions', () => {
  assert.equal(allows(requireExactRole('manager'), ['manager']), true);
  assert.equal(allows(requireExactRole('manager'), ['owner']), false);
  assert.equal(allows(requireExactRole('manager'), ['super_admin']), false);
});

test('a multi-role principal passes if ANY role qualifies', () => {
  assert.equal(allows(requireStaffAdmin, ['cms_author', 'admin']), true);
  assert.equal(allows(requireStaffAdmin, ['cms_author', 'viewer']), false);
});

// ── guards reject unauthenticated callers ────────────────────────────────────
test('every guard rejects a request with no auth context', () => {
  for (const guard of [requireStaffAdmin, requireSuperAdmin, requireRole('viewer')]) {
    let err = null;
    guard({}, {}, (e) => { err = e; });
    assert.ok(err, 'missing req.auth must be refused');
    assert.equal(err.status, 401);
  }
});

test('a denied guard returns 403, not 401', () => {
  const err = runGuard(requireStaffAdmin, ['viewer']);
  assert.ok(err);
  assert.equal(err.status, 403);
});

// ── permissions ──────────────────────────────────────────────────────────────
test('super_admin holds every permission', () => {
  assert.equal(hasPermission({ auth: { roles: ['super_admin'] } }, 'anything:at:all'), true);
});

test('an explicit permission claim grants without a high role', () => {
  assert.equal(hasPermission({ auth: { roles: ['member'], permissions: ['manage:billing'] } }, 'manage:billing'), true);
  assert.equal(hasPermission({ auth: { roles: ['member'], permissions: [] } }, 'manage:billing'), false);
});

test('functional roles carry their own implied permissions', () => {
  assert.equal(hasPermission({ auth: { roles: ['finance'] } }, 'manage:billing'), true);
  assert.equal(hasPermission({ auth: { roles: ['finance'] } }, 'delete:org'), false);
});

test('a wildcard permission claim grants everything', () => {
  assert.equal(hasPermission({ auth: { roles: ['viewer'], permissions: ['*'] } }, 'manage:org'), true);
});

// ── role confusion ───────────────────────────────────────────────────────────
test('platform roles are a separate namespace from org roles', () => {
  assert.equal(isPlatformRole('platform_admin'), true);
  assert.equal(isPlatformRole('admin'), false);
});

test('assertNoRoleConfusion rejects a platform role used as an org membership', () => {
  assert.throws(() => assertNoRoleConfusion('platform_admin'), /role_confusion|platform role/i);
  assert.equal(assertNoRoleConfusion('admin'), 'admin');
});
