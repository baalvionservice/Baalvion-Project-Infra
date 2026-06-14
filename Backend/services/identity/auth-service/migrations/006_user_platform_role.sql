-- Baalvion Auth Service — Migration 006: explicit platform-operator role (C4 remediation)
--
-- ROOT CAUSE being closed: organization roles (admin/owner) and the legacy super_admin were
-- treated as tenant-RLS-bypass roles, so a per-organization administrator could read across
-- tenants. Bypass is now restricted to explicit GLOBAL platform roles
-- (platform_admin / platform_security_admin). This migration gives those roles a home.
--
-- auth.users.platform_role is the SINGLE authoritative source of a cross-tenant grant. It is
-- added to the access token's roles[] at issuance (authService.resolveTokenPayload /
-- issueOnBehalf). NULL for every ordinary tenant user → tenant isolation enforced (fail-closed).
--
-- Idempotent: safe to re-run.

BEGIN;

ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS platform_role VARCHAR(32) DEFAULT NULL;

-- Integrity: a platform_role may only ever be one of the explicit platform roles, or NULL.
-- This makes it impossible to smuggle a tenant role (admin/owner/super_admin) into the
-- cross-tenant grant column at the database level.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_platform_role_chk'
    ) THEN
        ALTER TABLE auth.users
            ADD CONSTRAINT users_platform_role_chk
            CHECK (platform_role IS NULL OR platform_role IN
                ('platform_admin', 'platform_security_admin', 'platform_support_admin'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_platform_role
    ON auth.users (platform_role) WHERE platform_role IS NOT NULL;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- OPERATOR ACTION (run MANUALLY, deliberately — NOT auto-applied):
--
-- Grant platform_admin to the real platform operators. We intentionally do NOT auto-promote every
-- user who currently holds a 'super_admin' team membership: a super_admin membership may be
-- tenant-scoped, and blindly granting platform bypass to such a principal would re-open the exact
-- cross-tenant breach this migration closes. Promote a VETTED allowlist by email instead:
--
--   UPDATE auth.users
--      SET platform_role = 'platform_admin'
--    WHERE email IN ('ops-operator@baalvion.com', 'sre@baalvion.com');   -- ← edit allowlist
--
-- To review candidates before granting (humans, not a script, decide):
--
--   SELECT u.id, u.email, tm.role AS membership_role, tm.org_id
--     FROM auth.users u
--     JOIN auth.team_members tm ON tm.user_id = u.id
--    WHERE tm.role = 'super_admin'
--    ORDER BY u.email;
--
-- Until an operator is explicitly granted a platform_role, NO ONE can bypass tenant isolation —
-- which is the correct, fail-closed posture.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
