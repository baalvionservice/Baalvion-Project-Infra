UPDATE tradeops.vessels SET vessel_type = 'other' WHERE vessel_type = 'yacht';

ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS chk_vessels_type;
ALTER TABLE tradeops.vessels ADD CONSTRAINT chk_vessels_type CHECK (vessel_type IN (
    'container', 'bulk_carrier', 'tanker', 'oil_tanker', 'chemical_tanker', 'lng_carrier',
    'lpg_carrier', 'roro', 'car_carrier', 'general_cargo', 'multi_purpose', 'reefer',
    'cruise', 'ferry', 'passenger', 'tug', 'offshore_supply', 'fishing', 'research',
    'dredger', 'heavy_lift', 'barge', 'naval', 'rig', 'other'
));
