// C4 regression: the tenant-context resolver must grant bypass ONLY to platform operators.
// Proves a tenant admin/owner/finance token yields bypass=false (RLS enforced), and a
// platform_admin token yields bypass=true.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tenancy = require('../index.js');
const { PLATFORM_BYPASS_ROLES, hasTenantBypass, defaultResolve, tenantMiddleware } = tenancy;

const reqWith = (roles, tenantId = 'tenant-A') => ({ auth: { roles, tenantId }, headers: {} });

test('defaultResolve grants bypass only to platform bypass roles', () => {
  for (const r of ['admin', 'owner', 'super_admin', 'finance', 'compliance', 'auditor', 'viewer']) {
    const ctx = defaultResolve(reqWith([r]), PLATFORM_BYPASS_ROLES);
    assert.equal(ctx.bypass, false, `tenant role ${r} must NOT bypass`);
    assert.equal(ctx.tenantId, 'tenant-A');
  }
  assert.equal(defaultResolve(reqWith(['platform_admin']), PLATFORM_BYPASS_ROLES).bypass, true);
  assert.equal(defaultResolve(reqWith(['platform_security_admin']), PLATFORM_BYPASS_ROLES).bypass, true);
  // platform_support_admin is NOT a bypass role.
  assert.equal(defaultResolve(reqWith(['platform_support_admin']), PLATFORM_BYPASS_ROLES).bypass, false);
});

test('tenantMiddleware default (no opts) uses platform-only bypass — org admin cannot bypass', () => {
  const mw = tenantMiddleware(); // default bypassRoles = PLATFORM_BYPASS_ROLES
  const run = (roles) => {
    const req = reqWith(roles);
    let called = false;
    mw(req, {}, () => { called = true; });
    assert.equal(called, true, 'next() must be called');
    return req.tenant;
  };
  assert.equal(run(['admin']).bypass, false);
  assert.equal(run(['owner']).bypass, false);
  assert.equal(run(['super_admin']).bypass, false);
  assert.equal(run(['platform_admin']).bypass, true);
});

test('hasTenantBypass mirrors the resolver decision', () => {
  assert.equal(hasTenantBypass(['admin', 'owner', 'super_admin']), false);
  assert.equal(hasTenantBypass(['platform_admin']), true);
});
