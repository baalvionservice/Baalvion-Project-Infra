-- Fail-closed tenant Row-Level Security for the FX domain.
--
-- For every tenant-scoped table we ENABLE + FORCE RLS and install a
-- <table>_tenant_isolation policy keyed on the tenant column. ENABLE alone
-- does NOT apply to the table OWNER (and RLS is always ignored for SUPERUSERS),
-- so a service connecting as the owner would silently bypass isolation — a
-- cross-tenant data leak. FORCE makes the policy apply to the owner too.
--
-- This migration is INERT until the runtime half is in place: the application
-- MUST connect as a NON-SUPERUSER role (e.g. baalvion_app) and set
-- `app.current_tenant_id` per transaction. Until both hold, the USING clause
-- has no value to compare against and every row is filtered out (fail-closed).
-- See financial-services-java/docs/TENANT_ISOLATION.md.
--
-- Global / shared reference tables are intentionally NOT covered:
--   fx.fx_rates        — market rate snapshots, shared reference data (no tenant_id)
--   fx.processed_events — inbox de-dup ledger keyed by event_id (no tenant_id)

-- fx.fx_rate_locks (tenant_id uuid)
ALTER TABLE fx.fx_rate_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx.fx_rate_locks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fx_rate_locks_tenant_isolation ON fx.fx_rate_locks;
CREATE POLICY fx_rate_locks_tenant_isolation ON fx.fx_rate_locks
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- fx.fx_conversions (tenant_id uuid)
ALTER TABLE fx.fx_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx.fx_conversions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fx_conversions_tenant_isolation ON fx.fx_conversions;
CREATE POLICY fx_conversions_tenant_isolation ON fx.fx_conversions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- fx.fx_forwards (tenant_id uuid)
ALTER TABLE fx.fx_forwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx.fx_forwards FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fx_forwards_tenant_isolation ON fx.fx_forwards;
CREATE POLICY fx_forwards_tenant_isolation ON fx.fx_forwards
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- fx.outbox_events (tenant_id uuid)
ALTER TABLE fx.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON fx.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON fx.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
