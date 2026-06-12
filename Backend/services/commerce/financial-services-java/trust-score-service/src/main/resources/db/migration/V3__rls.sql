-- Fail-closed tenant Row-Level Security for the trust_score schema.
-- FORCE applies the policy to the table owner too (not just non-owners).
-- These policies are INERT until BOTH conditions hold: the connection uses a
-- non-superuser role, AND `app.current_tenant_id` is set per transaction.
-- See financial-services-java/docs/TENANT_ISOLATION.md.

-- trust_score.trust_scores (tenant_id uuid)
ALTER TABLE trust_score.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score.trust_scores FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trust_scores_tenant_isolation ON trust_score.trust_scores;
CREATE POLICY trust_scores_tenant_isolation ON trust_score.trust_scores
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- trust_score.trust_score_history (tenant_id uuid)
ALTER TABLE trust_score.trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score.trust_score_history FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trust_score_history_tenant_isolation ON trust_score.trust_score_history;
CREATE POLICY trust_score_history_tenant_isolation ON trust_score.trust_score_history
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- trust_score.outbox_events (tenant_id uuid)
ALTER TABLE trust_score.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON trust_score.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON trust_score.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- SKIPPED: trust_score.processed_events — no tenant_id/org_id/organization_id column.
-- It is a global exactly-once dedup ledger keyed by event_id (UUID PRIMARY KEY),
-- not tenant-scoped, so no RLS policy applies.
