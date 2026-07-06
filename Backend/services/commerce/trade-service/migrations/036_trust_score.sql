-- 036 — Phase 2 Trust/Verification/Compliance Foundation: Trust Score Engine.
--
-- tradeops.trust_scores — append-only history of the 0-100 trust score
-- (identity/company/bank/compliance/trading-history/feedback/document-health/risk
-- weighted composite), is_current marking the latest row per org.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.trust_scores (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          integer       NOT NULL,
    score           integer       NOT NULL,
    breakdown       jsonb         NOT NULL DEFAULT '{}'::jsonb,
    is_current      boolean       NOT NULL DEFAULT true,
    computed_at     timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_trust_scores_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT chk_trust_scores_score CHECK (score >= 0 AND score <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_scores_current ON tradeops.trust_scores (org_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_trust_scores_org_time      ON tradeops.trust_scores (org_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_scores_tenant        ON tradeops.trust_scores (tenant_id);

ALTER TABLE tradeops.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.trust_scores FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.trust_scores;
CREATE POLICY tenant_isolation ON tradeops.trust_scores
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
