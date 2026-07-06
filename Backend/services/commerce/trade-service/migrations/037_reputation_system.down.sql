-- Down for 037.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.reputation_summaries;
DROP TABLE IF EXISTS tradeops.reputation_summaries;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.reputation_ratings;
DROP TABLE IF EXISTS tradeops.reputation_ratings;
