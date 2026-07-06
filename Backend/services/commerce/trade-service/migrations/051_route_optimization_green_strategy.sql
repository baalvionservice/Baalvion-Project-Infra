-- 051 — Route Optimizer: GREEN strategy (Phase 3, Prompt 2).
--
-- Adds a `green` pick alongside cheapest/fastest/balanced to
-- tradeops.route_optimizations (migration 019). CO2 (`co2_kg`) was already computed
-- per leg/route by the Logistics Optimization Agent (service/logistics/schema.js's
-- EMISSION_FACTORS) but was informational-only; this migration lets a run persist
-- the lowest-emissions candidate as a first-class selectable strategy, matching the
-- Freight Management spec's "route optimization: cheapest / fastest / balanced /
-- green / priority" requirement.
ALTER TABLE tradeops.route_optimizations ADD COLUMN IF NOT EXISTS green jsonb;

ALTER TABLE tradeops.route_optimizations DROP CONSTRAINT IF EXISTS chk_route_optimizations_strategy;
ALTER TABLE tradeops.route_optimizations
    ADD CONSTRAINT chk_route_optimizations_strategy CHECK (strategy IS NULL OR strategy IN ('cheapest','fastest','balanced','green'));

ALTER TABLE tradeops.route_optimizations DROP CONSTRAINT IF EXISTS chk_route_optimizations_selected_strategy;
ALTER TABLE tradeops.route_optimizations
    ADD CONSTRAINT chk_route_optimizations_selected_strategy CHECK (selected_strategy IS NULL OR selected_strategy IN ('cheapest','fastest','balanced','green','explicit'));
