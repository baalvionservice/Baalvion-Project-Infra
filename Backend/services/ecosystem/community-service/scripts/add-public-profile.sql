-- Public profile page: a handle, what to show, and social links. Safe to re-run.
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS handle varchar(30);
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS public_profile boolean NOT NULL DEFAULT false;
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS public_name varchar(80);
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS headline varchar(120);
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS known_for varchar(600);
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS member_profiles_handle_uq ON community.member_profiles (lower(handle)) WHERE handle IS NOT NULL;
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS search_index boolean NOT NULL DEFAULT true;
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS company_name varchar(120);
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS role_title varchar(80);
CREATE INDEX IF NOT EXISTS member_profiles_public_idx ON community.member_profiles (public_profile, is_founder);
