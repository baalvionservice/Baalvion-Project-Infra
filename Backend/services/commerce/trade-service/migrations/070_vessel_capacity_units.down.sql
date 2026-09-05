ALTER TABLE tradeops.vessels
    DROP COLUMN IF EXISTS passenger_capacity,
    DROP COLUMN IF EXISTS lane_metres,
    DROP COLUMN IF EXISTS cubic_metres,
    DROP COLUMN IF EXISTS capacity_value,
    DROP COLUMN IF EXISTS capacity_unit;
