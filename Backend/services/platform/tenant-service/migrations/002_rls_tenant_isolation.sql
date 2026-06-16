-- Fail-closed tenant Row-Level Security for the tenant schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=tenant tenantColumn=tenant_id tables=tenant_branding,tenant_domains,tenant_entitlements
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "tenant"."tenant_branding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant"."tenant_branding" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "tenant"."tenant_branding";
CREATE POLICY "tenant_isolation" ON "tenant"."tenant_branding"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "tenant"."tenant_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant"."tenant_domains" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "tenant"."tenant_domains";
CREATE POLICY "tenant_isolation" ON "tenant"."tenant_domains"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "tenant"."tenant_entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant"."tenant_entitlements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "tenant"."tenant_entitlements";
CREATE POLICY "tenant_isolation" ON "tenant"."tenant_entitlements"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));
