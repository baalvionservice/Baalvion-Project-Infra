-- Phone verification (OTP) for public buyer/seller self-service auth.
-- Adds a phone number + verification timestamp to auth.users and a one-time-code
-- table (auth.phone_otps). Idempotent — safe to re-run. Apply as the MIGRATION/owner
-- role; the runtime connects as baalvion_app.
--
-- Design notes:
--   • code_hash stores sha256(code) — the plaintext OTP is NEVER persisted.
--   • attempts is incremented on each verify so the service can lock out brute force.
--   • consumed_at marks an OTP as spent (single-use); a NULL value is "live".
--   • purpose lets the same table back signup verification, login step-up, etc.

CREATE SCHEMA IF NOT EXISTS auth;

-- ── auth.users: phone columns ───────────────────────────────────────────────────
ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "phone"             VARCHAR(32);
ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMPTZ;

-- ── auth.phone_otps: one-time verification codes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "auth"."phone_otps" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id"     BIGINT       NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "phone"       VARCHAR(32)  NOT NULL,
    "code_hash"   TEXT         NOT NULL,
    "purpose"     VARCHAR(32)  NOT NULL DEFAULT 'verify',
    "expires_at"  TIMESTAMPTZ  NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "attempts"    INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "phone_otps_user_id_idx" ON "auth"."phone_otps" ("user_id");
CREATE INDEX IF NOT EXISTS "phone_otps_phone_idx"   ON "auth"."phone_otps" ("phone");
-- Fast lookup of the single live OTP for a user (the service consumes the latest unconsumed row).
CREATE INDEX IF NOT EXISTS "phone_otps_live_idx"    ON "auth"."phone_otps" ("user_id", "consumed_at");
