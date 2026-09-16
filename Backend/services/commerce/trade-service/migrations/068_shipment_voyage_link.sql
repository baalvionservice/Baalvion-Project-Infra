-- 068 — Links a shipment to the sailing it actually rides on.
--
-- tradeops.shipments already carried `vessel_name` / `voyage_no` as FREE TEXT, typed in
-- by whoever created the shipment. That string can't be joined to anything: it can't
-- tell you where the ship is now, when it really departed, or that the schedule moved.
-- These columns bind a shipment to the real rows from migration 065 instead, so a
-- shipment's ETA and position are DERIVED from the voyage's port calls rather than
-- re-entered and left to drift.
--
-- Additive and nullable: the existing free-text fields stay (they remain the only
-- record for shipments booked outside a scheduled sailing, e.g. charter or air), and
-- nothing is backfilled — an unlinked shipment behaves exactly as it does today.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function bodies.

ALTER TABLE tradeops.shipments ADD COLUMN IF NOT EXISTS voyage_id uuid REFERENCES tradeops.voyages(id) ON DELETE SET NULL;
ALTER TABLE tradeops.shipments ADD COLUMN IF NOT EXISTS load_port_call_id uuid REFERENCES tradeops.voyage_port_calls(id) ON DELETE SET NULL;
ALTER TABLE tradeops.shipments ADD COLUMN IF NOT EXISTS discharge_port_call_id uuid REFERENCES tradeops.voyage_port_calls(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_voyage ON tradeops.shipments (voyage_id);
