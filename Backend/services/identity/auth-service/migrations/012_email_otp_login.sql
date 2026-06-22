-- Passwordless email-OTP login for the central identity stack.
-- A user requests a one-time code by email; on verify we find-or-create the account
-- (exactly like social login) and mint the same RS256 session as password login.
-- Idempotent — safe to re-run. Apply as the MIGRATION/owner role; the runtime connects
-- as baalvion_app.
--
-- Design notes (mirrors auth.phone_otps, but keyed by EMAIL — the request is pre-auth and the
-- user may not exist yet, so there is no user_id at request time):
--   • code_hash stores sha256(code) — the plaintext OTP is NEVER persisted.
--   • attempts is incremented on each verify so the service can lock out brute force.
--   • consumed_at marks an OTP as spent (single-use); a NULL value is "live".
--   • purpose lets the same table back login, step-up, etc.
--   • NOT tenant-scoped → no org_id, so (like phone_otps) it is intentionally excluded from
--     the 009 RLS policy set.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS "auth"."email_otps" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "email"       VARCHAR(255) NOT NULL,
    -- Name captured at REQUEST time (the public sign-up collects First + Last before the code) and
    -- bound to this code so verify provisions the account with the right name — never re-sent (and
    -- therefore never spoofable) at verify. Unverified until the code is entered.
    "first_name"  VARCHAR(80),
    "last_name"   VARCHAR(80),
    "code_hash"   TEXT         NOT NULL,
    "purpose"     VARCHAR(32)  NOT NULL DEFAULT 'login',
    "expires_at"  TIMESTAMPTZ  NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "attempts"    INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Add the name columns to a pre-existing table too (idempotent — safe whether the table was created
-- above or by an earlier run of this migration without these columns).
ALTER TABLE "auth"."email_otps" ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(80);
ALTER TABLE "auth"."email_otps" ADD COLUMN IF NOT EXISTS "last_name"  VARCHAR(80);

CREATE INDEX IF NOT EXISTS "email_otps_email_idx" ON "auth"."email_otps" ("email");
-- The resend hard-cap counts recent sends per email by created_at — keep that scan index-backed.
CREATE INDEX IF NOT EXISTS "email_otps_email_created_idx" ON "auth"."email_otps" ("email", "created_at");
-- Fast lookup of the single live OTP for an email (the service consumes the latest unconsumed row).
CREATE INDEX IF NOT EXISTS "email_otps_live_idx"  ON "auth"."email_otps" ("email", "consumed_at");
