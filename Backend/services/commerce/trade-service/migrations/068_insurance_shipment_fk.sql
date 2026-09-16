-- 068 — Make the insurance→shipment reference real.
--
-- `insurance_policies.shipment_id` / `insurance_claims.shipment_id` were free-text
-- TEXT with no foreign key. models/insurance_policies.js documents why: two candidate
-- targets existed and neither matched — trade.shipments (legacy, INTEGER PK) and
-- tradeops.shipments (UUID PK) — so a policy could name a shipment that did not
-- exist, and the lane could never be re-rated from it.
--
-- That ambiguity is now resolved by the data: trade.shipments is EMPTY and nothing
-- writes it any more, while tradeops.shipments is the table the whole tracking,
-- customs, incident and sailing-schedule layer already references. tradeops wins.
--
-- Existing references are preserved, not discarded: anything that is not a live
-- tradeops shipment id is copied into metadata.legacyShipmentRef before the column
-- is narrowed, so no provenance is lost when the FK is imposed.
--
-- RUNNER COMPATIBILITY: flat statements only — no DO-blocks.

-- ── keep what cannot survive the narrowing ───────────────────────────────────
UPDATE "trade".insurance_policies
   SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{legacyShipmentRef}', to_jsonb(shipment_id))
 WHERE shipment_id IS NOT NULL
   AND (shipment_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OR NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id::text = shipment_id));

UPDATE "trade".insurance_claims
   SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{legacyShipmentRef}', to_jsonb(shipment_id))
 WHERE shipment_id IS NOT NULL
   AND (shipment_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OR NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id::text = shipment_id));

UPDATE "trade".general_average_contributions
   SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{legacyShipmentRef}', to_jsonb(shipment_id))
 WHERE shipment_id IS NOT NULL
   AND (shipment_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OR NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id::text = shipment_id));

-- ── narrow to uuid, dropping only what the FK could never accept ─────────────
ALTER TABLE "trade".insurance_policies
    ALTER COLUMN shipment_id TYPE uuid
    USING (CASE WHEN shipment_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN shipment_id::uuid ELSE NULL END);

ALTER TABLE "trade".insurance_claims
    ALTER COLUMN shipment_id TYPE uuid
    USING (CASE WHEN shipment_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN shipment_id::uuid ELSE NULL END);

ALTER TABLE "trade".general_average_contributions
    ALTER COLUMN shipment_id TYPE uuid
    USING (CASE WHEN shipment_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN shipment_id::uuid ELSE NULL END);

UPDATE "trade".insurance_policies p SET shipment_id = NULL
 WHERE p.shipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id = p.shipment_id);

UPDATE "trade".insurance_claims c SET shipment_id = NULL
 WHERE c.shipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id = c.shipment_id);

UPDATE "trade".general_average_contributions g SET shipment_id = NULL
 WHERE g.shipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tradeops.shipments s WHERE s.id = g.shipment_id);

-- ── the constraint that makes the reference trustworthy ──────────────────────
ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS fk_insurance_policies_shipment;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT fk_insurance_policies_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL;

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_shipment;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT fk_insurance_claims_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL;

ALTER TABLE "trade".general_average_contributions DROP CONSTRAINT IF EXISTS fk_gac_shipment;
ALTER TABLE "trade".general_average_contributions
    ADD CONSTRAINT fk_gac_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_policies_shipment ON "trade".insurance_policies (shipment_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_shipment   ON "trade".insurance_claims (shipment_id);
