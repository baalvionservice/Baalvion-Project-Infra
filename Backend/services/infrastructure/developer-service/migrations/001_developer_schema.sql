-- developer-service schema — API keys, webhooks, OpenAPI specs, event-type registry.
CREATE SCHEMA IF NOT EXISTS developer;

CREATE TABLE IF NOT EXISTS developer.api_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        VARCHAR(128),
    name          VARCHAR(160) NOT NULL,
    key_prefix    VARCHAR(24) NOT NULL,
    key_hash      CHAR(64) NOT NULL,
    last4         VARCHAR(8),
    mode          VARCHAR(8) NOT NULL DEFAULT 'live',
    scopes        JSONB NOT NULL DEFAULT '[]',
    status        VARCHAR(16) NOT NULL DEFAULT 'active',
    rate_limit_per_min INTEGER NOT NULL DEFAULT 600,
    metadata      JSONB NOT NULL DEFAULT '{}',
    last_used_at  TIMESTAMPTZ,
    last_used_ip  VARCHAR(45),
    expires_at    TIMESTAMPTZ,
    rotated_at    TIMESTAMPTZ,
    revoked_at    TIMESTAMPTZ,
    created_by    VARCHAR(64),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON developer.api_keys (key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON developer.api_keys (org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON developer.api_keys (status);

CREATE TABLE IF NOT EXISTS developer.webhook_endpoints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      VARCHAR(128),
    url         TEXT NOT NULL,
    description VARCHAR(255),
    secret      VARCHAR(80) NOT NULL,
    events      JSONB NOT NULL DEFAULT '["*"]',
    mode        VARCHAR(8) NOT NULL DEFAULT 'live',
    status      VARCHAR(16) NOT NULL DEFAULT 'active',
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_by  VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_ep_org ON developer.webhook_endpoints (org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_ep_status ON developer.webhook_endpoints (status);

CREATE TABLE IF NOT EXISTS developer.webhook_deliveries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id      UUID NOT NULL REFERENCES developer.webhook_endpoints (id) ON DELETE CASCADE,
    org_id           VARCHAR(128),
    event_type       VARCHAR(120) NOT NULL,
    event_id         UUID NOT NULL DEFAULT gen_random_uuid(),
    payload          JSONB NOT NULL DEFAULT '{}',
    status           VARCHAR(16) NOT NULL DEFAULT 'pending',
    attempts         INTEGER NOT NULL DEFAULT 0,
    max_attempts     INTEGER NOT NULL DEFAULT 6,
    last_status_code INTEGER,
    last_error       TEXT,
    response_snippet TEXT,
    next_attempt_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webhook_del_ep ON developer.webhook_deliveries (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_del_due ON developer.webhook_deliveries (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS developer.api_specs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service     VARCHAR(80) NOT NULL,
    title       VARCHAR(160) NOT NULL,
    version     VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    spec        JSONB NOT NULL DEFAULT '{}',
    is_public   BOOLEAN NOT NULL DEFAULT false,
    status      VARCHAR(16) NOT NULL DEFAULT 'active',
    created_by  VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (service, version)
);

CREATE TABLE IF NOT EXISTS developer.event_types (
    name        VARCHAR(120) PRIMARY KEY,
    category    VARCHAR(60),
    description TEXT,
    sample      JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
