-- Fail-closed tenant Row-Level Security for the supplier schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=supplier tenantColumn=org_id tables=suppliers,qualification_docs,scorecards
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "supplier"."suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier"."suppliers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "supplier"."suppliers";
CREATE POLICY "tenant_isolation" ON "supplier"."suppliers"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "supplier"."qualification_docs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier"."qualification_docs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "supplier"."qualification_docs";
CREATE POLICY "tenant_isolation" ON "supplier"."qualification_docs"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "supplier"."scorecards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier"."scorecards" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "supplier"."scorecards";
CREATE POLICY "tenant_isolation" ON "supplier"."scorecards"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
