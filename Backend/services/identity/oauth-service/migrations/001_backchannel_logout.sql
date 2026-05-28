-- Slice #2: OIDC RP-initiated + back-channel single-logout support for oauth-service.
-- Idempotent. Apply against the `auth` schema. Adds per-client logout configuration without
-- touching the hot-path client columns (authorize/token queries are unchanged).
ALTER TABLE auth.oauth_clients
    ADD COLUMN IF NOT EXISTS backchannel_logout_uri    TEXT,
    ADD COLUMN IF NOT EXISTS post_logout_redirect_uris JSONB NOT NULL DEFAULT '[]'::jsonb;
