-- Revert 068. Drop the FKs, widen back to text, and restore any reference that was
-- parked in metadata when the column was narrowed.

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS fk_insurance_policies_shipment;
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_shipment;
ALTER TABLE "trade".general_average_contributions DROP CONSTRAINT IF EXISTS fk_gac_shipment;

DROP INDEX IF EXISTS "trade".idx_insurance_policies_shipment;
DROP INDEX IF EXISTS "trade".idx_insurance_claims_shipment;

ALTER TABLE "trade".insurance_policies ALTER COLUMN shipment_id TYPE text USING shipment_id::text;
ALTER TABLE "trade".insurance_claims ALTER COLUMN shipment_id TYPE text USING shipment_id::text;
ALTER TABLE "trade".general_average_contributions ALTER COLUMN shipment_id TYPE text USING shipment_id::text;

UPDATE "trade".insurance_policies SET shipment_id = metadata->>'legacyShipmentRef'
 WHERE shipment_id IS NULL AND metadata ? 'legacyShipmentRef';
UPDATE "trade".insurance_claims SET shipment_id = metadata->>'legacyShipmentRef'
 WHERE shipment_id IS NULL AND metadata ? 'legacyShipmentRef';
UPDATE "trade".general_average_contributions SET shipment_id = metadata->>'legacyShipmentRef'
 WHERE shipment_id IS NULL AND metadata ? 'legacyShipmentRef';
