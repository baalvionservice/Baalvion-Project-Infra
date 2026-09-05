-- 068 — Add 'yacht' to the vessel type vocabulary.
--
-- The shipping-directory ingest (067) surfaced ~250 IMO-registered vessels Wikidata types
-- as yacht / motor yacht / luxury yacht. They are none of the existing categories, and
-- forcing them into 'other' hides a real, well-populated class. Large yachts carry IMO
-- numbers and appear in the registry like any other vessel.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function bodies.

ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS chk_vessels_type;
ALTER TABLE tradeops.vessels ADD CONSTRAINT chk_vessels_type CHECK (vessel_type IN (
    'container', 'bulk_carrier', 'tanker', 'oil_tanker', 'chemical_tanker', 'lng_carrier',
    'lpg_carrier', 'roro', 'car_carrier', 'general_cargo', 'multi_purpose', 'reefer',
    'cruise', 'ferry', 'passenger', 'tug', 'offshore_supply', 'fishing', 'research',
    'dredger', 'heavy_lift', 'barge', 'naval', 'rig', 'yacht', 'other'
));
