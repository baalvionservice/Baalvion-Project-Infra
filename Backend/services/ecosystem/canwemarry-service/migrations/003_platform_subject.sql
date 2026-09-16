-- Map the identity provider's subject to a local user id.
--
-- The service originally used the JWT `sub` AS users.id, on the assumption that it was a
-- UUID. It is not: auth-service issues a bigint (`"21"`), so provisioning failed against the
-- real identity stack the moment it was tried end to end.
--
-- Rather than widen every foreign key to TEXT, the local id stays a generated UUID and the
-- provider's subject moves to its own column. Two benefits beyond fixing the type:
-- the subject format can change without touching this schema again, and a leaked CanWeMarry
-- user id no longer identifies a platform account.
SET search_path TO canwemarry, public;

ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_subject TEXT;

-- Existing rows were keyed by the subject itself, so that is what their subject was.
UPDATE users SET platform_subject = id::text WHERE platform_subject IS NULL;

ALTER TABLE users ALTER COLUMN platform_subject SET NOT NULL;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_platform_subject ON users(platform_subject);
