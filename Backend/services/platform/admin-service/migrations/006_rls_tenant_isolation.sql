-- Fail-closed tenant Row-Level Security for the admin schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=admin tenantColumn=org_id tables=support_tickets,dev_webhooks,dev_sandboxes
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "admin"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin"."support_tickets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "admin"."support_tickets";
CREATE POLICY "tenant_isolation" ON "admin"."support_tickets"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "admin"."dev_webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin"."dev_webhooks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "admin"."dev_webhooks";
CREATE POLICY "tenant_isolation" ON "admin"."dev_webhooks"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "admin"."dev_sandboxes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin"."dev_sandboxes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "admin"."dev_sandboxes";
CREATE POLICY "tenant_isolation" ON "admin"."dev_sandboxes"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
