-- Revert oms tenant RLS (schema=oms tables=outbox_events,order_saga_state).

DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."outbox_events";
ALTER TABLE "oms"."outbox_events" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "oms"."outbox_events" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."order_saga_state";
ALTER TABLE "oms"."order_saga_state" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "oms"."order_saga_state" DISABLE ROW LEVEL SECURITY;
