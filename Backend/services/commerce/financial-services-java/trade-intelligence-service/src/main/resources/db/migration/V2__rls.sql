-- =====================================================================================
-- Fail-closed tenant Row-Level Security for the trade_intelligence schema.
--
-- Both ENABLE and FORCE ROW LEVEL SECURITY are applied: FORCE makes the policy apply
-- to the table OWNER as well (not just ordinary roles), so a misconfigured owner-role
-- connection cannot bypass tenant isolation.
--
-- This migration is INERT until BOTH of the following hold at query time:
--   1. The connection uses a NON-SUPERUSER role (superusers bypass RLS entirely), and
--   2. `app.current_tenant_id` is SET (per transaction) to the active tenant UUID.
-- If `app.current_tenant_id` is unset, current_setting(...) raises and the policy
-- fails closed (no rows visible / no rows writable) — the intended safe default.
--
-- See financial-services-java/docs/TENANT_ISOLATION.md for the role + GUC contract.
-- =====================================================================================

-- demand_forecasts — tenant_id uuid
ALTER TABLE trade_intelligence.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_intelligence.demand_forecasts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demand_forecasts_tenant_isolation ON trade_intelligence.demand_forecasts;
CREATE POLICY demand_forecasts_tenant_isolation ON trade_intelligence.demand_forecasts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- supplier_risks — tenant_id uuid
ALTER TABLE trade_intelligence.supplier_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_intelligence.supplier_risks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_risks_tenant_isolation ON trade_intelligence.supplier_risks;
CREATE POLICY supplier_risks_tenant_isolation ON trade_intelligence.supplier_risks
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
