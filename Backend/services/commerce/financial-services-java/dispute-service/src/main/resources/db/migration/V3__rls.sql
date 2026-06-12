-- Fail-closed tenant Row-Level Security for the dispute schema.
-- FORCE ROW LEVEL SECURITY makes the policy apply to the table owner too
-- (not just non-owner roles), so even the migration/owner role is constrained.
-- These policies are INERT until BOTH conditions hold at runtime:
--   1. queries run as a non-superuser role (superusers bypass RLS), and
--   2. `app.current_tenant_id` is set per transaction (e.g. SET LOCAL).
-- If app.current_tenant_id is unset, current_setting(...) raises and the row is
-- denied (fail-closed). See financial-services-java/docs/TENANT_ISOLATION.md.

ALTER TABLE dispute.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute.disputes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS disputes_tenant_isolation ON dispute.disputes;
CREATE POLICY disputes_tenant_isolation ON dispute.disputes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE dispute.dispute_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute.dispute_actions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dispute_actions_tenant_isolation ON dispute.dispute_actions;
CREATE POLICY dispute_actions_tenant_isolation ON dispute.dispute_actions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE dispute.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON dispute.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON dispute.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
