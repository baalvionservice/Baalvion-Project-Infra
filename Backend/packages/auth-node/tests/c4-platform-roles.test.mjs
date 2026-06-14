// C4 regression: tenant roles must NEVER bypass tenant isolation; only explicit platform roles may.
// Locks the platform-vs-tenant role separation so org admin/owner can never re-acquire bypass.
import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../index.js';

const {
  PLATFORM_ROLES, PLATFORM_BYPASS_ROLES,
  isPlatformRole, hasTenantBypass, assertNoRoleConfusion,
  requirePlatformRole, requireRole,
} = pkg;

test('PLATFORM_BYPASS_ROLES is exactly the two platform-data roles (no tenant roles)', () => {
  assert.deepEqual([...PLATFORM_BYPASS_ROLES].sort(), ['platform_admin', 'platform_security_admin']);
  for (const tenantRole of ['super_admin', 'owner', 'admin', 'manager', 'finance', 'compliance', 'viewer']) {
    assert.equal(PLATFORM_BYPASS_ROLES.includes(tenantRole), false, `${tenantRole} must not bypass`);
  }
});

test('platform_support_admin is a platform role but does NOT get data bypass (least privilege)', () => {
  assert.equal(isPlatformRole('platform_support_admin'), true);
  assert.equal(hasTenantBypass(['platform_support_admin']), false);
});

test('hasTenantBypass: tenant roles never bypass, platform bypass roles do', () => {
  // The C4 breach: each of these previously bypassed; now none may.
  for (const roles of [['admin'], ['owner'], ['super_admin'], ['finance'], ['compliance'], ['buyer'], ['supplier']]) {
    assert.equal(hasTenantBypass(roles), false, `${roles[0]} must NOT bypass`);
  }
  assert.equal(hasTenantBypass(['platform_admin']), true);
  assert.equal(hasTenantBypass(['platform_security_admin']), true);
  // A platform operator who also holds an org role still bypasses (via the platform role only).
  assert.equal(hasTenantBypass(['admin', 'platform_admin']), true);
  assert.equal(hasTenantBypass([]), false);
  assert.equal(hasTenantBypass('admin'), false);
});

test('assertNoRoleConfusion: an org-membership role must never be a platform role', () => {
  for (const ok of ['admin', 'owner', 'super_admin', 'manager', 'viewer']) {
    assert.equal(assertNoRoleConfusion(ok), ok);
  }
  for (const bad of PLATFORM_ROLES) {
    assert.throws(() => assertNoRoleConfusion(bad), /role_confusion|platform role/i, `${bad} must be rejected as a membership role`);
  }
});

test('requirePlatformRole rejects tenant roles (even super_admin) and admits platform roles', () => {
  const run = (roles) => {
    let status = 200; let passed = false;
    const req = { auth: { roles } };
    const next = (err) => { if (err) status = err.status || 500; else passed = true; };
    requirePlatformRole('platform_admin', 'platform_security_admin')(req, {}, next);
    return { status, passed };
  };
  assert.equal(run(['super_admin']).status, 403, 'super_admin is NOT a platform operator');
  assert.equal(run(['owner']).status, 403);
  assert.equal(run(['admin']).status, 403);
  assert.equal(run(['platform_admin']).passed, true);
  assert.equal(run(['admin', 'platform_security_admin']).passed, true);
});

test('org requireRole is unchanged (super_admin still satisfies org checks)', () => {
  let passed = false;
  requireRole('admin')({ auth: { roles: ['super_admin'] } }, {}, (err) => { if (!err) passed = true; });
  assert.equal(passed, true);
});
