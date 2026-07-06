-- 038 — Phase 2 Trust/Verification/Compliance Foundation: Manual Review Console.
--
-- tradeops.review_actions — rich, human-facing decision log (richer than the
-- generic hash-chained trade.audit_logs: carries reviewer notes + escalation
-- target) for every reviewable entity across the 15 verification modules. Every
-- action ALSO writes to the existing audit_logs hash chain (utils/audit.js) for
-- tamper-evidence — this table is the human-readable review history, not a
-- replacement for it.
--
-- Also adds the 'reviewer' role value to trade.users so review-console access can
-- be granted without overloading 'admin'/'operator'.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

ALTER TYPE trade.enum_users_role ADD VALUE IF NOT EXISTS 'reviewer';

CREATE TABLE IF NOT EXISTS tradeops.review_actions (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         text          NOT NULL DEFAULT 'T-DEMO',
    org_id            integer,
    reviewable_type   text          NOT NULL,
    reviewable_id     uuid          NOT NULL,
    action            text          NOT NULL,
    reviewer_user_id  text          NOT NULL,
    notes             text,
    escalated_to      text,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_review_actions_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT chk_review_actions_reviewable_type CHECK (reviewable_type IN (
        'identity', 'company', 'stakeholder', 'tax', 'bank', 'address', 'facility',
        'product_certificate', 'document', 'compliance_rule'
    )),
    CONSTRAINT chk_review_actions_action CHECK (action IN ('approve', 'reject', 'request_more_info', 'escalate'))
);

CREATE INDEX IF NOT EXISTS idx_review_actions_reviewable ON tradeops.review_actions (reviewable_type, reviewable_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_actions_org         ON tradeops.review_actions (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_review_actions_tenant       ON tradeops.review_actions (tenant_id);

ALTER TABLE tradeops.review_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.review_actions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.review_actions;
CREATE POLICY tenant_isolation ON tradeops.review_actions
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
