'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { enableRlsSql, disableRlsSql, runWithTenant, getTenantContext, SESSION } = require('./index');

test('enableRlsSql emits FORCE RLS + fail-closed policy', () => {
    const sql = enableRlsSql('rbac', 'roles', { tenantColumn: 'tenant_id' });
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);                 // applies to table owner
    assert.match(sql, /CREATE POLICY "tenant_isolation"/);
    assert.match(sql, /app\.current_tenant/);
    assert.match(sql, /app\.tenant_bypass.*=.*'on'/);
    assert.match(sql, /"tenant_id"::text =/);                       // type-agnostic match
    assert.match(sql, /WITH CHECK/);                                // blocks cross-tenant inserts
});

test('enableRlsSql HARDENS the bypass against the app role by default (CR-8)', () => {
    const sql = enableRlsSql('rbac', 'roles', { tenantColumn: 'tenant_id' });
    // bypass must require a NON-app role, so an injection flipping app.tenant_bypass on
    // the runtime baalvion_app connection cannot defeat isolation.
    assert.match(sql, /current_user <> 'baalvion_app'/);
});

test('enableRlsSql honours a custom appRole and can opt out of hardening', () => {
    const custom = enableRlsSql('rbac', 'roles', { appRole: 'svc_app' });
    assert.match(custom, /current_user <> 'svc_app'/);
    const legacy = enableRlsSql('rbac', 'roles', { hardenBypass: false });
    assert.doesNotMatch(legacy, /current_user <>/);                 // unconditional bypass
    assert.match(legacy, /app\.tenant_bypass.*=.*'on'/);
});

test('enableRlsSql escapes a single-quote in appRole (no SQL break)', () => {
    const sql = enableRlsSql('rbac', 'roles', { appRole: "o'brien" });
    assert.match(sql, /current_user <> 'o''brien'/);
});

test('disableRlsSql reverses it', () => {
    const sql = disableRlsSql('rbac', 'roles');
    assert.match(sql, /DROP POLICY IF EXISTS/);
    assert.match(sql, /DISABLE ROW LEVEL SECURITY/);
});

test('tenant context propagates via AsyncLocalStorage across awaits', async () => {
    assert.deepEqual(getTenantContext(), { tenantId: null, bypass: false });
    await runWithTenant({ tenantId: 'org-1' }, async () => {
        await new Promise((r) => setTimeout(r, 1));
        assert.equal(getTenantContext().tenantId, 'org-1');
        assert.equal(getTenantContext().bypass, false);
    });
    await runWithTenant({ bypass: true }, async () => {
        assert.equal(getTenantContext().bypass, true);
    });
    // context does not leak outside the run
    assert.equal(getTenantContext().tenantId, null);
});

test('session GUC names are the canonical ones', () => {
    assert.equal(SESSION.tenant, 'app.current_tenant');
    assert.equal(SESSION.bypass, 'app.tenant_bypass');
});
