-- 037 — Phase 2 Trust/Verification/Compliance Foundation: Reputation System.
--
--   • tradeops.reputation_ratings — append-only individual ratings (buyer/seller/
--     agent), optionally tied to a completed order.
--   • tradeops.reputation_summaries — denormalized per-org-per-role aggregate
--     (avg rating, total ratings, completed orders, avg response time, dispute
--     rate), recomputed after every new rating. This is also what
--     service/verification/trustScore.js's feedback component reads once
--     populated (it defaults to neutral until this table has rows for an org).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.reputation_ratings (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    rater_org_id          integer,
    rater_user_id         integer,
    ratee_org_id          integer       NOT NULL,
    role                  text          NOT NULL,
    order_id              uuid,
    rating_value          smallint      NOT NULL,
    response_time_seconds integer,
    dispute_outcome       text,
    comment               text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_reputation_ratings_ratee FOREIGN KEY (ratee_org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_reputation_ratings_rater FOREIGN KEY (rater_org_id) REFERENCES trade.organizations (id) ON DELETE SET NULL,
    CONSTRAINT chk_reputation_ratings_role CHECK (role IN ('buyer', 'seller', 'agent')),
    CONSTRAINT chk_reputation_ratings_value CHECK (rating_value >= 1 AND rating_value <= 5)
);

CREATE INDEX IF NOT EXISTS idx_reputation_ratings_ratee   ON tradeops.reputation_ratings (ratee_org_id, role);
CREATE INDEX IF NOT EXISTS idx_reputation_ratings_tenant  ON tradeops.reputation_ratings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_ratings_created_brin ON tradeops.reputation_ratings USING brin (created_at);

ALTER TABLE tradeops.reputation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.reputation_ratings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.reputation_ratings;
CREATE POLICY tenant_isolation ON tradeops.reputation_ratings
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.reputation_summaries (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    org_id              integer       NOT NULL,
    role                text          NOT NULL,
    avg_rating          numeric(3,2)  NOT NULL DEFAULT 0,
    total_ratings       integer       NOT NULL DEFAULT 0,
    completed_orders    integer       NOT NULL DEFAULT 0,
    avg_response_time   integer,
    dispute_rate        numeric(5,4)  NOT NULL DEFAULT 0,
    computed_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_reputation_summaries_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT uq_reputation_summaries_org_role UNIQUE (org_id, role),
    CONSTRAINT chk_reputation_summaries_role CHECK (role IN ('buyer', 'seller', 'agent'))
);

CREATE INDEX IF NOT EXISTS idx_reputation_summaries_tenant ON tradeops.reputation_summaries (tenant_id);

ALTER TABLE tradeops.reputation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.reputation_summaries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.reputation_summaries;
CREATE POLICY tenant_isolation ON tradeops.reputation_summaries
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
