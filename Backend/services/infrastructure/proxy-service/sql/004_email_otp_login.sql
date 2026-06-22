-- Passwordless email-OTP login for proxy.baalvionstack.com customer auth.
-- A customer requests a one-time code by email; on verify we find-or-create the account
-- (same provisioning as social login) and mint the same RS256 session as password login.
-- Idempotent — safe to re-run.  Run with: psql $DATABASE_URL -v ON_ERROR_STOP=1 -f sql/004_email_otp_login.sql
--
-- Keyed by EMAIL (the request is pre-auth and the user may not exist yet). NOT tenant-scoped
-- (no org_id) → intentionally excluded from the 002 RLS policy set, exactly like the table is
-- only ever touched by the auth flow before a tenant context exists.
--   • code_hash stores sha256(code) — the plaintext OTP is NEVER persisted.
--   • attempts increments on each verify so the service can lock out brute force.
--   • consumed_at marks an OTP as spent (single-use); NULL = "live".

CREATE TABLE IF NOT EXISTS email_otps (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    code_hash   TEXT         NOT NULL,
    purpose     VARCHAR(32)  NOT NULL DEFAULT 'login',
    expires_at  TIMESTAMPTZ  NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps (email);
-- Fast lookup of the single live OTP for an email.
CREATE INDEX IF NOT EXISTS email_otps_live_idx  ON email_otps (email, consumed_at);
