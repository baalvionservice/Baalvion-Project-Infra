-- 070 — carry a vessel's stated capacity WITH the unit it was stated in.
--
-- 069 assumed "maximum capacity" on a ship meant TEU. Across 12,000 hulls the source
-- actually states it in passengers (347), TEU (15), lane metres, cubic metres and motor
-- cars — plus a dimensionless "1" on ~480 items that declares a number and refuses to say
-- of what. Collapsing all of that into capacity_teu would have published several hundred
-- ferry PASSENGER counts on this site as container capacity.
--
-- So each unit gets a column of its own, capacity_teu means TEU and nothing else, and a
-- capacity whose unit the source did not state is kept as capacity_value with a NULL
-- capacity_unit and is not rendered as anything. The vessel type is not used to guess it:
-- "it's a container ship, so 20,124 must be TEU" is an inference, not a source.

ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS passenger_capacity integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS lane_metres        numeric(10,1);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS cubic_metres       numeric(12,1);

-- The raw statement, for capacities in a unit with no column of its own.
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS capacity_value numeric(14,2);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS capacity_unit  text;

CREATE INDEX IF NOT EXISTS idx_vessels_teu_present ON tradeops.vessels (capacity_teu DESC) WHERE capacity_teu IS NOT NULL;
