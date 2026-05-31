-- Baalvion Audit Service — immutable, append-only, hash-chained audit trail.
-- Isolated `audit` schema. Rows are NEVER updated or deleted (WORM, enforced by
-- triggers); each row is hash-chained to the previous one so tampering is
-- detectable. The chain hash is computed by the application (single source of
-- hashing truth); the DB only enforces append-only + ordering.

CREATE SCHEMA IF NOT EXISTS audit;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS audit.events (
    seq            BIGSERIAL PRIMARY KEY,
    event_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when the action happened
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when audit captured it

    -- actor (the subject who acted)
    actor_id       VARCHAR(64),
    actor_org_id   VARCHAR(128),
    ip_address     VARCHAR(45),
    user_agent     TEXT,

    -- what happened
    action         VARCHAR(160) NOT NULL,
    resource_type  VARCHAR(120),
    resource_id    VARCHAR(255),
    tenant_id      VARCHAR(128),
    scope_id       VARCHAR(128),
    outcome        VARCHAR(16) NOT NULL DEFAULT 'success' CHECK (outcome IN ('success','deny','failure')),
    severity       VARCHAR(16) NOT NULL DEFAULT 'info'    CHECK (severity IN ('info','low','medium','high','critical')),

    -- provenance
    source_service VARCHAR(80),
    app_id         VARCHAR(80),
    correlation_id VARCHAR(128),
    metadata       JSONB NOT NULL DEFAULT '{}',

    -- tamper-evidence (hash chain)
    prev_hash      CHAR(64) NOT NULL,
    hash           CHAR(64) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit.events (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit.events (action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit.events (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_time     ON audit.events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_service  ON audit.events (source_service);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit.events (severity);
CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON audit.events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_corr     ON audit.events (correlation_id);

-- ─── Append-only (WORM) enforcement ────────────────────────────────────────────
-- Any UPDATE/DELETE/TRUNCATE is rejected at the DB level — even for the table owner.
CREATE OR REPLACE FUNCTION audit.prevent_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit.events is append-only — % is not permitted', TG_OP
        USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_no_update   ON audit.events;
DROP TRIGGER IF EXISTS trg_audit_no_delete   ON audit.events;
DROP TRIGGER IF EXISTS trg_audit_no_truncate ON audit.events;

CREATE TRIGGER trg_audit_no_update   BEFORE UPDATE   ON audit.events FOR EACH ROW       EXECUTE FUNCTION audit.prevent_mutation();
CREATE TRIGGER trg_audit_no_delete   BEFORE DELETE   ON audit.events FOR EACH ROW       EXECUTE FUNCTION audit.prevent_mutation();
CREATE TRIGGER trg_audit_no_truncate BEFORE TRUNCATE ON audit.events FOR EACH STATEMENT EXECUTE FUNCTION audit.prevent_mutation();
