-- Migration 002: Add family_id to refresh_tokens for reuse-detection chain
-- Run before deploying the new auth-service build.

ALTER TABLE auth.refresh_tokens
    ADD COLUMN IF NOT EXISTS family_id UUID;

-- Back-fill existing rows with a generated UUID so NOT NULL constraint can be added
UPDATE auth.refresh_tokens
    SET family_id = gen_random_uuid()
    WHERE family_id IS NULL;

ALTER TABLE auth.refresh_tokens
    ALTER COLUMN family_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rt_family_id ON auth.refresh_tokens (family_id);

-- Optionally: drop old refresh token rows (they used HS256 and are invalid anyway)
-- DELETE FROM auth.refresh_tokens WHERE created_at < now() - INTERVAL '1 day';
