-- Fail-closed tenant Row-Level Security for the auth schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=auth tenantColumn=org_id tables=team_members,invitations,sessions,audit_logs,auth_audit_log
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "auth"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth"."team_members" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "auth"."team_members";
CREATE POLICY "tenant_isolation" ON "auth"."team_members"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "auth"."invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth"."invitations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "auth"."invitations";
CREATE POLICY "tenant_isolation" ON "auth"."invitations"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth"."sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "auth"."sessions";
CREATE POLICY "tenant_isolation" ON "auth"."sessions"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "auth"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth"."audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "auth"."audit_logs";
CREATE POLICY "tenant_isolation" ON "auth"."audit_logs"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "auth"."auth_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth"."auth_audit_log" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "auth"."auth_audit_log";
CREATE POLICY "tenant_isolation" ON "auth"."auth_audit_log"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
