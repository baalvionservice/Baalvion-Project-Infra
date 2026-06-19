-- Fail-closed tenant Row-Level Security for the trade schema.
-- Canonical policy from @baalvion/tenancy enableRlsSql (CR-8 hardened bypass:
-- app.tenant_bypass is denied to the runtime baalvion_app role). Idempotent.
-- schema=trade tenantColumn=tenant_id tables=deals,organizations,rfqs,users,refresh_tokens
-- Apply as the MIGRATION/owner role; the runtime connects as baalvion_app.

ALTER TABLE "trade"."deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade"."deals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."deals";
CREATE POLICY "tenant_isolation" ON "trade"."deals"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "trade"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade"."organizations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."organizations";
CREATE POLICY "tenant_isolation" ON "trade"."organizations"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "trade"."rfqs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade"."rfqs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."rfqs";
CREATE POLICY "tenant_isolation" ON "trade"."rfqs"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "trade"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade"."users" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."users";
CREATE POLICY "tenant_isolation" ON "trade"."users"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "trade"."refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade"."refresh_tokens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."refresh_tokens";
CREATE POLICY "tenant_isolation" ON "trade"."refresh_tokens"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));
