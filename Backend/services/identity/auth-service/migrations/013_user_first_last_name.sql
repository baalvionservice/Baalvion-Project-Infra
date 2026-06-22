-- First/last name on the central identity user, for the public sign-in/sign-up (email-OTP)
-- experience: the user enters First + Last name, we generate avatar initials from them and greet
-- the user by name. `full_name` is kept as the combined display value for backward compatibility
-- (every existing presenter + downstream service still reads it).
--
-- Idempotent — safe to re-run. Apply as the MIGRATION/owner role; the runtime connects as
-- baalvion_app. These are additive nullable columns → no RLS / no lock-heavy rewrite.

ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(80);
ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "last_name"  VARCHAR(80);

-- Best-effort backfill from any existing full_name (first token → first_name, remainder → last_name).
-- Only touches rows that have a full_name but no split parts yet, so re-running is a no-op.
UPDATE "auth"."users"
   SET "first_name" = NULLIF(split_part(trim("full_name"), ' ', 1), ''),
       "last_name"  = NULLIF(trim(substr(trim("full_name"), length(split_part(trim("full_name"), ' ', 1)) + 1)), '')
 WHERE "full_name" IS NOT NULL
   AND trim("full_name") <> ''
   AND "first_name" IS NULL
   AND "last_name"  IS NULL;
