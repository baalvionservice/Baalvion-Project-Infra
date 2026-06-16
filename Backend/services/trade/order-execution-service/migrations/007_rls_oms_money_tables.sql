-- 007_rls_oms_money_tables.sql — harden the bypass on the remaining oms money tables.
--
-- RLS is ALREADY enabled on every tenant-scoped oms table:
--   oms.orders            (001_init.sql)
--   oms.kyc_verifications (004_kyc_verifications.sql)
--   oms.order_payments    (005_order_payments.sql)
--   oms.outbox_events     (006_rls_tenant_isolation.sql)
--   oms.order_saga_state  (006_rls_tenant_isolation.sql)
-- but the THREE money-truth tables created before 006 (orders, kyc_verifications,
-- order_payments) carry the LEGACY un-hardened bypass — `app.tenant_bypass='on'`
-- with NO `current_user <> 'baalvion_app'` guard. The service connects as the
-- non-superuser baalvion_app role (config.db.user default), so a SQL injection that
-- flips app.tenant_bypass on the app connection would defeat tenant isolation on
-- exactly the rows that hold the money. 006 already closed this for the outbox/saga
-- infra tables; this migration re-applies the SAME CR-8 hardened tenant_isolation
-- policy (the canonical form emitted by @baalvion/tenancy enableRlsSql, identical to
-- 006) to the three money tables.
--
-- IDEMPOTENT: ENABLE/FORCE are no-ops if already on; DROP POLICY IF EXISTS + CREATE
-- POLICY replaces the legacy policy in place. Re-runnable. Apply as the MIGRATION/
-- owner role (MIGRATION_DB_USER); the runtime connects as baalvion_app.
--
-- SKIPPED: oms.processed_webhooks — it has NO tenant column (PK = webhook_id); it is a
-- GLOBAL webhook-idempotency ledger, so a tenant_isolation policy cannot apply.
-- schema=oms tenantColumn=tenant_id tables=orders,kyc_verifications,order_payments
BEGIN;

ALTER TABLE "oms"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oms"."orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."orders";
CREATE POLICY "tenant_isolation" ON "oms"."orders"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "oms"."kyc_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oms"."kyc_verifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."kyc_verifications";
CREATE POLICY "tenant_isolation" ON "oms"."kyc_verifications"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

ALTER TABLE "oms"."order_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oms"."order_payments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."order_payments";
CREATE POLICY "tenant_isolation" ON "oms"."order_payments"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

COMMIT;
