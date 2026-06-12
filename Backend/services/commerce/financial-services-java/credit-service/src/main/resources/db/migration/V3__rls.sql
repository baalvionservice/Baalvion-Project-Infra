-- Fail-closed tenant Row-Level Security for the `credit` schema.
--
-- ENABLE ROW LEVEL SECURITY makes each policy gate every row by tenant.
-- FORCE ROW LEVEL SECURITY applies the policy to the table OWNER too (Postgres
-- otherwise exempts the owner), so even the migration/owner role is isolated.
--
-- These policies are INERT until the application connects as a NON-SUPERUSER
-- role (superusers and BYPASSRLS roles skip RLS entirely) AND sets
-- `app.current_tenant_id` per transaction. If that GUC is unset, the
-- `current_setting(...)::uuid` cast raises and the query fails closed
-- (no rows leak). See financial-services-java/docs/TENANT_ISOLATION.md.

-- credit.financed_invoices
ALTER TABLE credit.financed_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.financed_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financed_invoices_tenant_isolation ON credit.financed_invoices;
CREATE POLICY financed_invoices_tenant_isolation ON credit.financed_invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- credit.invoice_collections
ALTER TABLE credit.invoice_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.invoice_collections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_collections_tenant_isolation ON credit.invoice_collections;
CREATE POLICY invoice_collections_tenant_isolation ON credit.invoice_collections
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- credit.bnpl_plans
ALTER TABLE credit.bnpl_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.bnpl_plans FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bnpl_plans_tenant_isolation ON credit.bnpl_plans;
CREATE POLICY bnpl_plans_tenant_isolation ON credit.bnpl_plans
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- credit.bnpl_installments
ALTER TABLE credit.bnpl_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.bnpl_installments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bnpl_installments_tenant_isolation ON credit.bnpl_installments;
CREATE POLICY bnpl_installments_tenant_isolation ON credit.bnpl_installments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- credit.bnpl_repayments
ALTER TABLE credit.bnpl_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.bnpl_repayments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bnpl_repayments_tenant_isolation ON credit.bnpl_repayments;
CREATE POLICY bnpl_repayments_tenant_isolation ON credit.bnpl_repayments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- credit.outbox_events
ALTER TABLE credit.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON credit.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON credit.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
