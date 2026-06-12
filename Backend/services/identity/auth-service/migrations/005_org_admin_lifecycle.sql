-- Baalvion Auth Service — Self-Service Multi-Org Administration
-- Migration 005: turns the auth schema into a true self-service multi-tenant trade OS.
--
-- A platform owner must be able to onboard unlimited organizations of any trade-network
-- type (bank, customs authority, logistics provider, …) and manage their full user
-- lifecycle WITHOUT developer involvement. This migration adds the columns those flows need:
--   • rich organization profile (legal/display name, country, jurisdiction, contacts)
--   • organization lifecycle status (active | suspended)
--   • platform-created orgs may exist before a human owner accepts an invite → owner_id nullable
--   • user lifecycle tracking (last_login_at) + force-MFA flag (mfa_required)
--   • a generous role CHECK so the full 7-tier membership model is integrity-enforced
--     without breaking any legacy rows.
--
-- Idempotent: safe to re-run.

-- ─── Organization profile + lifecycle ───────────────────────────────────────────
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS legal_name     VARCHAR(255);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS display_name   VARCHAR(255);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS country        VARCHAR(2);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS jurisdiction   VARCHAR(120);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS contact_email  VARCHAR(255);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS contact_phone  VARCHAR(40);
ALTER TABLE auth.organizations ADD COLUMN IF NOT EXISTS status         VARCHAR(16) NOT NULL DEFAULT 'active';

-- Organization lifecycle status (drop-then-add so re-runs pick up any change).
ALTER TABLE auth.organizations DROP CONSTRAINT IF EXISTS chk_org_status;
ALTER TABLE auth.organizations
    ADD CONSTRAINT chk_org_status CHECK (status IN ('active', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_orgs_status ON auth.organizations (status);

-- Platform-created orgs are seeded BEFORE their first human owner accepts an invite,
-- so owner_id must be nullable. Existing FK + index are preserved.
ALTER TABLE auth.organizations ALTER COLUMN owner_id DROP NOT NULL;

-- ─── User lifecycle ───────────────────────────────────────────────────────────
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
-- Force-MFA: when true, the user must enrol an authenticator before they can operate.
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS mfa_required  BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Membership role integrity ────────────────────────────────────────────────
-- The platform's capability model is the 7-tier set:
--   owner | admin | manager | officer | analyst | operator | viewer
-- Legacy values (member | editor | super_admin) are kept in the allow-list so this
-- constraint never rejects pre-existing rows; new admin flows only ever write the 7 tiers.
ALTER TABLE auth.team_members DROP CONSTRAINT IF EXISTS chk_member_role;
ALTER TABLE auth.team_members
    ADD CONSTRAINT chk_member_role CHECK (role IN (
        'owner', 'admin', 'manager', 'officer', 'analyst', 'operator', 'viewer',
        'member', 'editor', 'super_admin'
    ));

ALTER TABLE auth.team_members ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE auth.team_members ADD COLUMN IF NOT EXISTS suspended_by BIGINT REFERENCES auth.users(id);

-- ─── Invitation status (explicit, queryable) ────────────────────────────────────
-- accepted_at NULL + not-expired = pending. Add a revoked marker so revoked invites
-- are distinguishable from accepted ones in the admin UI (we soft-revoke, not destroy).
ALTER TABLE auth.invitations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE auth.invitations ADD COLUMN IF NOT EXISTS full_name  VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_invitations_status ON auth.invitations (org_id, accepted_at, revoked_at);
