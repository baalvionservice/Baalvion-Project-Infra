-- Revert 068 — unlink shipments from sailings (free-text vessel_name/voyage_no remain).
DROP INDEX IF EXISTS tradeops.idx_shipments_voyage;
ALTER TABLE tradeops.shipments DROP COLUMN IF EXISTS discharge_port_call_id;
ALTER TABLE tradeops.shipments DROP COLUMN IF EXISTS load_port_call_id;
ALTER TABLE tradeops.shipments DROP COLUMN IF EXISTS voyage_id;
