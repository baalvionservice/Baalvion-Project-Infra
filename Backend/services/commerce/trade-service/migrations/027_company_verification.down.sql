-- Down for 027.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.company_stakeholders;
DROP TABLE IF EXISTS tradeops.company_stakeholders;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.company_verifications;
DROP TABLE IF EXISTS tradeops.company_verifications;
