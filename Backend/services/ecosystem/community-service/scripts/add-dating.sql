-- Dating profiles and likes. sync({ alter: false }) creates new tables on boot; this file is the same shape for applying by hand. Safe to re-run.
CREATE TABLE IF NOT EXISTS community.dating_profiles (
  id uuid PRIMARY KEY, user_id varchar(64) NOT NULL UNIQUE, display_name varchar(80) NOT NULL, birth_date date NOT NULL,
  headline varchar(120), bio varchar(600), city varchar(80), is_founder boolean NOT NULL DEFAULT false,
  company_name varchar(120), role_title varchar(80), looking_for varchar(20) NOT NULL DEFAULT 'dating',
  interests varchar(40)[] NOT NULL DEFAULT '{}', photo_asset_id uuid, status varchar(12) NOT NULL DEFAULT 'active',
  hidden_reason varchar(300), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS dating_profiles_status_city ON community.dating_profiles (status, city);
CREATE TABLE IF NOT EXISTS community.dating_actions (
  id uuid PRIMARY KEY, from_user varchar(64) NOT NULL, to_user varchar(64) NOT NULL, action varchar(8) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS dating_actions_pair ON community.dating_actions (from_user, to_user);
CREATE INDEX IF NOT EXISTS dating_actions_to ON community.dating_actions (to_user, action);
