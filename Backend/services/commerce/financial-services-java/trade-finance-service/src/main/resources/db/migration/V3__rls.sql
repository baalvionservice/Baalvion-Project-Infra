-- Fail-closed tenant Row-Level Security for the trade_finance schema.
--
-- Every tenant-scoped table (one carrying a `tenant_id` column directly) is
-- isolated by a `<table>_tenant_isolation` policy keyed on
-- `current_setting('app.current_tenant_id')`. ENABLE turns RLS on; FORCE makes
-- the policy apply to the TABLE OWNER too (without FORCE the owning role — and
-- always any SUPERUSER — bypasses RLS, a silent cross-tenant leak).
--
-- This migration is INERT until the runtime half is in place: the application
-- MUST connect as a NON-SUPERUSER role (e.g. baalvion_app) and SET
-- `app.current_tenant_id` per transaction. Until then queries either run as a
-- privileged role (RLS ignored) or fail closed because the GUC is unset.
-- See financial-services-java/docs/TENANT_ISOLATION.md.
--
-- Child tables (lc_amendments, lc_presentations, guarantee_claims) carry their
-- own tenant_id column, so each is isolated independently rather than relying on
-- the parent FK. processed_events has no tenant column and is intentionally not
-- subject to RLS.

-- Letters of credit ------------------------------------------------------------
ALTER TABLE trade_finance.letters_of_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.letters_of_credit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS letters_of_credit_tenant_isolation ON trade_finance.letters_of_credit;
CREATE POLICY letters_of_credit_tenant_isolation ON trade_finance.letters_of_credit
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE trade_finance.lc_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.lc_amendments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lc_amendments_tenant_isolation ON trade_finance.lc_amendments;
CREATE POLICY lc_amendments_tenant_isolation ON trade_finance.lc_amendments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE trade_finance.lc_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.lc_presentations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lc_presentations_tenant_isolation ON trade_finance.lc_presentations;
CREATE POLICY lc_presentations_tenant_isolation ON trade_finance.lc_presentations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Bank guarantees --------------------------------------------------------------
ALTER TABLE trade_finance.bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.bank_guarantees FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_guarantees_tenant_isolation ON trade_finance.bank_guarantees;
CREATE POLICY bank_guarantees_tenant_isolation ON trade_finance.bank_guarantees
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE trade_finance.guarantee_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.guarantee_claims FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guarantee_claims_tenant_isolation ON trade_finance.guarantee_claims;
CREATE POLICY guarantee_claims_tenant_isolation ON trade_finance.guarantee_claims
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Transactional outbox ---------------------------------------------------------
ALTER TABLE trade_finance.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finance.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON trade_finance.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON trade_finance.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
