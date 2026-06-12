-- Fail-closed tenant Row-Level Security for the `smart_contract` schema.
--
-- ENABLE ROW LEVEL SECURITY makes each policy gate every row by tenant.
-- FORCE ROW LEVEL SECURITY applies the policy to the table OWNER too (Postgres
-- otherwise exempts the owner), so even the migration/owner role is isolated.
--
-- These policies are INERT until the application connects as a NON-SUPERUSER,
-- NON-BYPASSRLS role (superusers and BYPASSRLS roles skip RLS entirely) AND
-- sets `app.current_tenant_id` per transaction. If that GUC is unset, the
-- `current_setting(...)::uuid` cast raises and the query fails closed
-- (no rows leak). See financial-services-java/docs/TENANT_ISOLATION.md.
--
-- Tenant-scoped (tenant_id uuid):
--   smart_contract.trade_contracts
--   smart_contract.contract_signatures (carries its own tenant_id, not FK-only)
--   smart_contract.outbox_events
-- Skipped (no tenant column):
--   smart_contract.processed_events (global dedup ledger)

-- smart_contract.trade_contracts
ALTER TABLE smart_contract.trade_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contract.trade_contracts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trade_contracts_tenant_isolation ON smart_contract.trade_contracts;
CREATE POLICY trade_contracts_tenant_isolation ON smart_contract.trade_contracts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- smart_contract.contract_signatures
ALTER TABLE smart_contract.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contract.contract_signatures FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contract_signatures_tenant_isolation ON smart_contract.contract_signatures;
CREATE POLICY contract_signatures_tenant_isolation ON smart_contract.contract_signatures
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- smart_contract.outbox_events
ALTER TABLE smart_contract.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contract.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON smart_contract.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON smart_contract.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
