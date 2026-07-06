-- Down for 034.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.fraud_signals;
DROP TABLE IF EXISTS tradeops.fraud_signals;
ALTER TABLE tradeops.bank_accounts DROP COLUMN IF EXISTS account_number_fingerprint;
