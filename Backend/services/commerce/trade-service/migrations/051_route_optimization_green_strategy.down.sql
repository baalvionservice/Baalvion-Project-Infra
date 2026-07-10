ALTER TABLE tradeops.route_optimizations DROP CONSTRAINT IF EXISTS chk_route_optimizations_selected_strategy;
ALTER TABLE tradeops.route_optimizations
    ADD CONSTRAINT chk_route_optimizations_selected_strategy CHECK (selected_strategy IS NULL OR selected_strategy IN ('cheapest','fastest','balanced','explicit'));

ALTER TABLE tradeops.route_optimizations DROP CONSTRAINT IF EXISTS chk_route_optimizations_strategy;
ALTER TABLE tradeops.route_optimizations
    ADD CONSTRAINT chk_route_optimizations_strategy CHECK (strategy IS NULL OR strategy IN ('cheapest','fastest','balanced'));

ALTER TABLE tradeops.route_optimizations DROP COLUMN IF EXISTS green;
