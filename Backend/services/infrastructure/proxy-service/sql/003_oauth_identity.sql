-- Consumer social login (Google / GitHub) identity columns on public.users.
-- Idempotent — safe to re-run. Apply as the MIGRATION/owner role (it bypasses RLS);
-- the runtime connects as baalvion_app.
--
-- Design notes:
--   • A social account is matched first by (oauth_provider, oauth_provider_id), then
--     LINKED to an existing row by its VERIFIED email (the service refuses unverified ones).
--   • password_hash stays NOT NULL on purpose: OAuth-only users are created with an
--     unusable 'oauth:'+random placeholder (mirrors the existing SSO JIT path), so a
--     password login can never match for them. They can set a real password later via
--     forgot-password if they ever want one.
--   • avatar_url stores the provider profile picture for display.

ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "oauth_provider"    VARCHAR(32);
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "oauth_provider_id" TEXT;
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "avatar_url"         TEXT;

-- One account per (provider, provider user id). Partial index → it ignores the
-- (NULL, NULL) rows of every password account, so it costs nothing for them.
CREATE UNIQUE INDEX IF NOT EXISTS "users_oauth_identity_key"
    ON "public"."users" ("oauth_provider", "oauth_provider_id")
    WHERE "oauth_provider" IS NOT NULL AND "oauth_provider_id" IS NOT NULL;
