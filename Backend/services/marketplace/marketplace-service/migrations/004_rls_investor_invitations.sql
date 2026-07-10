-- Fail-closed tenant Row-Level Security for investor_invitations (added after
-- 002_rls_tenant_isolation.sql — see that file for the canonical policy shape).
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=marketplace tenantColumn=org_id tables=investor_invitations
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "marketplace"."investor_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketplace"."investor_invitations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "marketplace"."investor_invitations";
CREATE POLICY "tenant_isolation" ON "marketplace"."investor_invitations"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
