-- Baalvion Auth Service — Multi-Tenant Organization Types
-- Migration 004: classify every organization by its trade-network role.
--
-- Dashboard access in the GTI platform is determined by ORGANIZATION TYPE (which surface
-- you operate) combined with the member's ROLE (what you may do) — NOT by superadmin
-- persona impersonation. This column is the authoritative source of an org's type; it is
-- embedded into the access token (claim `org_type`) on every login/refresh.
--
-- Idempotent: safe to re-run.

-- ─── Organization type ──────────────────────────────────────────────────────────
-- Allowed values (validated at the application layer + the CHECK below):
--   buyer | seller | trade_agent | logistics_provider | customs_authority |
--   bank | insurance_provider | compliance_agency | regulator | platform_owner
ALTER TABLE auth.organizations
    ADD COLUMN IF NOT EXISTS type VARCHAR(40) NOT NULL DEFAULT 'buyer';

-- Drop-then-add so re-runs pick up any change to the allowed set.
ALTER TABLE auth.organizations DROP CONSTRAINT IF EXISTS chk_org_type;
ALTER TABLE auth.organizations
    ADD CONSTRAINT chk_org_type CHECK (type IN (
        'buyer', 'seller', 'trade_agent', 'logistics_provider', 'customs_authority',
        'bank', 'insurance_provider', 'compliance_agency', 'regulator', 'platform_owner'
    ));

CREATE INDEX IF NOT EXISTS idx_orgs_type ON auth.organizations (type);

-- The existing platform org (super-admin tenant) is the platform owner.
UPDATE auth.organizations SET type = 'platform_owner' WHERE slug = 'baalvion-platform';
