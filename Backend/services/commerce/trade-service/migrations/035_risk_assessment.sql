-- 035 — Phase 2 Trust/Verification/Compliance Foundation: Risk Assessment Engine.
--
-- tradeops.org_risk_assessments — append-only history of org-level risk scoring
-- runs (verification completion / company age / trading history / dispute history
-- / compliance status / document validity), with is_current marking the latest row
-- per org (partial unique index, same pattern as other "current snapshot" tables
-- in this schema).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.org_risk_assessments (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          integer       NOT NULL,
    risk_level      text          NOT NULL,
    score           numeric(5,2)  NOT NULL,
    factors         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    is_current      boolean       NOT NULL DEFAULT true,
    computed_at     timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_org_risk_assessments_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT chk_org_risk_assessments_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_risk_assessments_current ON tradeops.org_risk_assessments (org_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_org_risk_assessments_org_time      ON tradeops.org_risk_assessments (org_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_risk_assessments_tenant        ON tradeops.org_risk_assessments (tenant_id);

ALTER TABLE tradeops.org_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.org_risk_assessments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.org_risk_assessments;
CREATE POLICY tenant_isolation ON tradeops.org_risk_assessments
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
