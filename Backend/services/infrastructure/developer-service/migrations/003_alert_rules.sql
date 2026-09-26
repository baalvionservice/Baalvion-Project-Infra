-- Condition-based alert rules. news-service calls POST /v1/internal/alerts/evaluate with
-- each newly-enriched article; this service matches active rules and delivers signed
-- webhook POSTs (same HMAC scheme as services/signing.js) directly to rule.webhook_url —
-- deliberately not routed through the generic webhook_endpoints subscription model, since
-- that fans out by event TYPE only and has no payload-content filtering.
CREATE TABLE IF NOT EXISTS developer.alert_rules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            VARCHAR(128) NOT NULL,
    label             VARCHAR(160) NOT NULL,
    condition_type    VARCHAR(16) NOT NULL, -- keyword | category | country | sentiment | entity
    condition_value   VARCHAR(200) NOT NULL,
    webhook_url       TEXT NOT NULL,
    webhook_secret    VARCHAR(80) NOT NULL,
    active            BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count     INTEGER NOT NULL DEFAULT 0,
    created_by        VARCHAR(64),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_org ON developer.alert_rules (org_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON developer.alert_rules (active);

-- Same tenant-isolation policy shape as migrations/002_rls_tenant_isolation.sql.
ALTER TABLE "developer"."alert_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "developer"."alert_rules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "developer"."alert_rules";
CREATE POLICY "tenant_isolation" ON "developer"."alert_rules"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "org_id"::text = current_setting('app.current_tenant', true)));
