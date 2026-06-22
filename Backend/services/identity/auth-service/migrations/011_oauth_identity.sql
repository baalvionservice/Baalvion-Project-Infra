-- Social login (Google / Facebook) identity columns on auth.users.
-- Idempotent — safe to re-run. Apply as the MIGRATION/owner role (bypasses RLS);
-- the runtime connects as baalvion_app.
--
-- Mirrors the proxy-service approach: a social account is matched first by
-- (oauth_provider, oauth_provider_id), then LINKED to an existing row by its VERIFIED
-- email (the service refuses unverified provider emails). password_hash stays NOT NULL —
-- OAuth-only users get an unusable 'oauth:'+random placeholder so password login can
-- never match for them. avatar_url already exists on auth.users.

ALTER TABLE IF EXISTS "auth"."users" ADD COLUMN IF NOT EXISTS "oauth_provider"    VARCHAR(32);
ALTER TABLE IF EXISTS "auth"."users" ADD COLUMN IF NOT EXISTS "oauth_provider_id" TEXT;

-- One account per (provider, provider user id). Partial index → ignores the (NULL, NULL)
-- rows of every password account.
CREATE UNIQUE INDEX IF NOT EXISTS "users_oauth_identity_key"
    ON "auth"."users" ("oauth_provider", "oauth_provider_id")
    WHERE "oauth_provider" IS NOT NULL AND "oauth_provider_id" IS NOT NULL;
