-- Tenant isolation for the three sailing-schedule tables.
--
-- 065 created vessels, voyages and voyage_port_calls with `tenant_id NOT NULL`
-- and never enabled RLS, so they have been the only tenant tables in this service
-- without it. tradeops.vessels currently holds 95,870 rows tagged 'GLOBAL' — the
-- public world fleet behind ships.baalvion.com — alongside tenant-owned rows, so
-- the two are commingled in one table with nothing separating them.
--
-- The canonical policy is applied unchanged (see @baalvion/tenancy enableRlsSql),
-- plus ONE addition on vessels: the public directory reads it over a plain
-- connection with no tenant GUC, and a fail-closed policy alone would return zero
-- rows and blank the site. Permissive policies are OR'd, so a SELECT-only policy
-- for the 'GLOBAL' rows restores public reads without widening tenant access —
-- writes still go through tenant_isolation only.

ALTER TABLE tradeops.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.vessels FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.vessels;
CREATE POLICY tenant_isolation ON tradeops.vessels
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- Read-only carve-out for the public reference fleet. SELECT only and pinned to the
-- literal 'GLOBAL', so it can never expose a tenant's own vessels.
DROP POLICY IF EXISTS public_global_fleet_read ON tradeops.vessels;
CREATE POLICY public_global_fleet_read ON tradeops.vessels
    FOR SELECT
    USING (tenant_id::text = 'GLOBAL');

ALTER TABLE tradeops.voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.voyages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.voyages;
CREATE POLICY tenant_isolation ON tradeops.voyages
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

ALTER TABLE tradeops.voyage_port_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.voyage_port_calls FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.voyage_port_calls;
CREATE POLICY tenant_isolation ON tradeops.voyage_port_calls
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
