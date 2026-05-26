-- 005 — refresh-token sessions: rotating refresh tokens with device/session
-- tracking and automatic reuse-detection (OWASP refresh-token rotation).
-- Only sha256(secret) is persisted; the raw token is never stored.
CREATE TABLE IF NOT EXISTS trade.refresh_tokens (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      integer NOT NULL REFERENCES trade.users(id) ON DELETE CASCADE,
    tenant_id    varchar(64) NOT NULL DEFAULT 'T-DEMO',
    family_id    uuid NOT NULL,
    token_hash   varchar(64) NOT NULL,
    user_agent   varchar(512),
    ip           varchar(64),
    expires_at   timestamptz NOT NULL,
    revoked_at   timestamptz,
    rotated_to   uuid,
    last_used_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON trade.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON trade.refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON trade.refresh_tokens(token_hash);
-- Active-session lookups (list/revoke) filter on user_id + not-yet-revoked.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON trade.refresh_tokens(user_id) WHERE revoked_at IS NULL;
