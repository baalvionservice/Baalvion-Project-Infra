-- Phase 9 — unified auth audit stream. NEW table; does NOT modify earlier-phase tables
-- (the legacy auth.audit_logs remains; this is the canonical, richer auth-event stream).
CREATE TABLE IF NOT EXISTS auth.auth_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(48)  NOT NULL,
    user_id         BIGINT,
    org_id          UUID,
    session_id      VARCHAR(128),
    jti             VARCHAR(128),
    issuer          VARCHAR(64),
    app_id          VARCHAR(64),        -- from X-Baalvion-App
    impersonator_id BIGINT,             -- source admin for impersonation events
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    severity        VARCHAR(16)  NOT NULL DEFAULT 'info',
    metadata        JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aal_created_at ON auth.auth_audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_aal_user_id    ON auth.auth_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_aal_org_id     ON auth.auth_audit_log (org_id);
CREATE INDEX IF NOT EXISTS idx_aal_event_type ON auth.auth_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_aal_app_id     ON auth.auth_audit_log (app_id);

-- Retention is enforced by AuditService.purgeExpired() (AUTH_AUDIT_RETENTION_DAYS, default 365),
-- intended to run from a scheduled job.
