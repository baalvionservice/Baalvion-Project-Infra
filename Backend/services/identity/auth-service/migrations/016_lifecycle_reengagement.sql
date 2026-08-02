-- Lifecycle-email tracking for the re-engagement cron (jobs/reengagementCron.js):
--   signup_brand        -- which site the user signed up on (auth-baalvion's brand slug, e.g.
--                           'proxy', 'law', 'ctm'), captured at register()/oauthLogin/emailLogin
--                           time so later lifecycle emails (re-engagement) can theme correctly
--                           without re-deriving it. NULL for accounts created before this shipped
--                           (falls back to the flagship 'baalvion' theme at render time).
--   reengagement_sent_at -- last time a re-engagement email went out. Dedup key for the cron: a
--                           user is only eligible again after both the inactivity window AND the
--                           cooldown since their last re-engagement send have elapsed.
--
-- Idempotent — safe to re-run. Apply as the MIGRATION/owner role; the runtime connects as
-- baalvion_app. Additive nullable columns → no RLS / no lock-heavy rewrite.

ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "signup_brand" VARCHAR(50);
ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "reengagement_sent_at" TIMESTAMP WITH TIME ZONE;

-- Supports the cron's WHERE last_login_at < cutoff AND (reengagement_sent_at IS NULL OR ...)
-- scan without a full table scan as the user base grows.
CREATE INDEX IF NOT EXISTS "idx_users_last_login_at" ON "auth"."users" ("last_login_at");
