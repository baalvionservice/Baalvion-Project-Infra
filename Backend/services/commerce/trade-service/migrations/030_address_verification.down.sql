-- Down for 030.
ALTER TABLE tradeops.company_verifications DROP CONSTRAINT IF EXISTS fk_company_verifications_registered_address;
ALTER TABLE tradeops.company_verifications DROP CONSTRAINT IF EXISTS fk_company_verifications_operational_address;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.address_evidence;
DROP TABLE IF EXISTS tradeops.address_evidence;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.verified_addresses;
DROP TABLE IF EXISTS tradeops.verified_addresses;
