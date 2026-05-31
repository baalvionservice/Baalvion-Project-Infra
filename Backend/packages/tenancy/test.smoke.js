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
