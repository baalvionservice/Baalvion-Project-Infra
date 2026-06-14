-- Fail-closed tenant Row-Level Security for the aml schema.
--
-- Each tenant-scoped table gets a policy that restricts every row to the
-- caller's tenant: tenant_id must equal the per-transaction GUC
-- `app.current_tenant_id`. ENABLE turns RLS on; FORCE makes the policy apply
-- even to the table owner (so a non-superuser owner cannot bypass it).
--
-- This migration is INERT until the application connects as a NON-SUPERUSER,
-- NON-BYPASSRLS role and sets `app.current_tenant_id` per transaction. A
-- superuser (or a BYPASSRLS role) ignores RLS entirely; an unset GUC makes
-- `current_setting('app.current_tenant_id')::uuid` raise, so unscoped access
-- fails closed.
--
-- Runbook: ../../../../docs/TENANT_ISOLATION.md
-- (financial-services-java/docs/TENANT_ISOLATION.md)
--
-- Tenant-scoped (tenant_id uuid): aml.aml_alerts, aml.outbox_events
-- Skipped (no tenant column): aml.processed_events (global dedup ledger)

ALTER TABLE aml.aml_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml.aml_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aml_alerts_tenant_isolation ON aml.aml_alerts;
CREATE POLICY aml_alerts_tenant_isolation ON aml.aml_alerts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE aml.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON aml.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON aml.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
