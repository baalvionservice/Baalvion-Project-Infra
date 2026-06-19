-- Revert trade tenant RLS (schema=trade tables=deals,organizations,rfqs,users,refresh_tokens).

DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."deals";
ALTER TABLE "trade"."deals" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "trade"."deals" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."organizations";
ALTER TABLE "trade"."organizations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "trade"."organizations" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."rfqs";
ALTER TABLE "trade"."rfqs" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "trade"."rfqs" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."users";
ALTER TABLE "trade"."users" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "trade"."users" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "trade"."refresh_tokens";
ALTER TABLE "trade"."refresh_tokens" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "trade"."refresh_tokens" DISABLE ROW LEVEL SECURITY;
