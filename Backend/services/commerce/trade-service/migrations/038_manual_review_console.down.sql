-- Down for 038. The 'reviewer' enum value is NOT reverted — Postgres has no DROP
-- VALUE, and rebuilding the type against every dependent row is unsafe to do
-- blindly (same reasoning as migration 023's down file).
DROP POLICY IF EXISTS tenant_isolation ON tradeops.review_actions;
DROP TABLE IF EXISTS tradeops.review_actions;
