-- Fail-closed tenant Row-Level Security for the wallet schema.
--
-- Every tenant-scoped table is locked so a row is only visible/writable when its
-- tenant_id matches app.current_tenant_id for the current transaction. FORCE ROW
-- LEVEL SECURITY makes the policy apply to the table OWNER too (not just ordinary
-- roles), closing the usual owner-bypass hole.
--
-- These policies are INERT until BOTH conditions hold at runtime:
--   1. the connection runs as a NON-SUPERUSER role (superusers bypass RLS), and
--   2. app.current_tenant_id is SET (per transaction) to the caller's tenant uuid.
-- If app.current_tenant_id is unset, current_setting(...) raises and the query
-- fails closed (no rows leak). See financial-services-java/docs/TENANT_ISOLATION.md.

-- wallet.wallets (tenant_id uuid)
ALTER TABLE wallet.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.wallets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_tenant_isolation ON wallet.wallets;
CREATE POLICY wallets_tenant_isolation ON wallet.wallets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- wallet.wallet_balances (tenant_id uuid)
ALTER TABLE wallet.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.wallet_balances FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_balances_tenant_isolation ON wallet.wallet_balances;
CREATE POLICY wallet_balances_tenant_isolation ON wallet.wallet_balances
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- wallet.wallet_entries (tenant_id uuid)
ALTER TABLE wallet.wallet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.wallet_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_entries_tenant_isolation ON wallet.wallet_entries;
CREATE POLICY wallet_entries_tenant_isolation ON wallet.wallet_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- wallet.wallet_holds (tenant_id uuid)
ALTER TABLE wallet.wallet_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.wallet_holds FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_holds_tenant_isolation ON wallet.wallet_holds;
CREATE POLICY wallet_holds_tenant_isolation ON wallet.wallet_holds
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- wallet.outbox_events (tenant_id uuid) — transactional outbox is tenant-scoped,
-- same as the ledger/payment services, so it is RLS'd too.
ALTER TABLE wallet.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON wallet.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON wallet.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- SKIPPED: wallet.processed_events — inbox dedup table has no tenant_id/org_id/
-- organization_id column (PK is event_id only), so it is not tenant-scoped.
