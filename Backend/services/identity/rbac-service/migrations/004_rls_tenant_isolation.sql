-- Fail-closed tenant Row-Level Security for the rbac schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=rbac tenantColumn=tenant_id tables=roles,role_assignments,policies,subject_attributes,decision_logs
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "rbac"."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rbac"."roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "rbac"."roles";
CREATE POLICY "tenant_isolation" ON "rbac"."roles"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "rbac"."role_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rbac"."role_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "rbac"."role_assignments";
CREATE POLICY "tenant_isolation" ON "rbac"."role_assignments"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "rbac"."policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rbac"."policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "rbac"."policies";
CREATE POLICY "tenant_isolation" ON "rbac"."policies"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "rbac"."subject_attributes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rbac"."subject_attributes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "rbac"."subject_attributes";
CREATE POLICY "tenant_isolation" ON "rbac"."subject_attributes"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "rbac"."decision_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rbac"."decision_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "rbac"."decision_logs";
CREATE POLICY "tenant_isolation" ON "rbac"."decision_logs"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));
