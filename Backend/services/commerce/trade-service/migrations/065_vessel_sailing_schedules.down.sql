-- Revert 065 — drops the sailing-schedule tables (children first, FK order).
DROP TABLE IF EXISTS tradeops.voyage_port_calls;
DROP TABLE IF EXISTS tradeops.voyages;
DROP TABLE IF EXISTS tradeops.vessels;
