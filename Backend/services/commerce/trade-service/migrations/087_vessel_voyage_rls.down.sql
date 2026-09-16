DROP POLICY IF EXISTS public_global_fleet_read ON tradeops.vessels;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.vessels;
ALTER TABLE tradeops.vessels NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeops.vessels DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.voyages;
ALTER TABLE tradeops.voyages NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeops.voyages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.voyage_port_calls;
ALTER TABLE tradeops.voyage_port_calls NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeops.voyage_port_calls DISABLE ROW LEVEL SECURITY;
