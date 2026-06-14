-- Revert 004: drop the tenant-bound KYC verification registry.
BEGIN;
DROP TABLE IF EXISTS oms.kyc_verifications;
COMMIT;
