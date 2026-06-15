-- Fail-closed tenant Row-Level Security for the reports schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=reports tenantColumn=org_id tables=report_definitions,report_runs,report_schedules
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "reports"."report_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports"."report_definitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "reports"."report_definitions";
CREATE POLICY "tenant_isolation" ON "reports"."report_definitions"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "reports"."report_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports"."report_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "reports"."report_runs";
CREATE POLICY "tenant_isolation" ON "reports"."report_runs"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "reports"."report_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports"."report_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "reports"."report_schedules";
CREATE POLICY "tenant_isolation" ON "reports"."report_schedules"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
