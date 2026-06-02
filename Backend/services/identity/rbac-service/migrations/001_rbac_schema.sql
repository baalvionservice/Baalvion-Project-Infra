-- Baalvion RBAC Service — Phase 1: RBAC core (tenants, roles, hierarchy, assignments)
-- Isolated `rbac` schema. References to users/orgs are by id ONLY (no cross-schema
-- FK into auth.*) so the service stays decoupled and conflict-free.
-- Run once against baalvion_db before starting the service.

CREATE SCHEMA IF NOT EXISTS rbac;

-- ─── Tenants ────────────────────────────────────────────────────────────────
-- Multi-tenancy tree:  platform ─► country ─► organization
-- Exactly one platform tenant (the root, parent_id IS NULL, type='platform').
CREATE TABLE IF NOT EXISTS rbac.tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type          VARCHAR(20)  NOT NULL CHECK (type IN ('platform','country','organization')),
    parent_id     UUID REFERENCES rbac.tenants(id) ON DELETE CASCADE,
    -- external_ref ties the tenant to a real-world id: country code ('IN') or the
    -- owning auth.organizations.id for an organization tenant. NULL for platform.
    external_ref  VARCHAR(128),
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(160) NOT NULL,
    status        VARCHAR(16)  NOT NULL DEFAULT 'active',
    attributes    JSONB        NOT NULL DEFAULT '{}',   -- ABAC tenant attributes
    metadata      JSONB        NOT NULL DEFAULT '{}',
    created_by    VARCHAR(64),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (type, external_ref),
    UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_tenants_parent ON rbac.tenants (parent_id);
CREATE INDEX IF NOT EXISTS idx_tenants_type   ON rbac.tenants (type);

-- ─── Roles ──────────────────────────────────────────────────────────────────
-- Per-tenant roles (multi-tenant: separate roles per tenant). System roles
-- (super_admin/country_admin/organization_admin/end_user) are seeded with
-- is_system=true and cannot be deleted. `level` is the hierarchy rank
-- (higher = more privileged); `parent_role_id` encodes inheritance.
CREATE TABLE IF NOT EXISTS rbac.roles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES rbac.tenants(id) ON DELETE CASCADE,
    key            VARCHAR(64)  NOT NULL,
    name           VARCHAR(128) NOT NULL,
    description    TEXT,
    scope_type     VARCHAR(20)  NOT NULL CHECK (scope_type IN ('platform','country','organization'))
                                 DEFAULT 'organization',
    level          INTEGER      NOT NULL DEFAULT 100,
    parent_role_id UUID REFERENCES rbac.roles(id) ON DELETE SET NULL,
    is_system      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_assignable  BOOLEAN      NOT NULL DEFAULT TRUE,
    status         VARCHAR(16)  NOT NULL DEFAULT 'active',
    attributes     JSONB        NOT NULL DEFAULT '{}',   -- ABAC role attributes
    metadata       JSONB        NOT NULL DEFAULT '{}',
    created_by     VARCHAR(64),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON rbac.roles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON rbac.roles (parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_level  ON rbac.roles (level);

-- ─── Role assignments ─────────────────────────────────────────────────────────
-- Grants a role to a user within a concrete scope. user_id is the token subject
-- (auth `sub`) stored as text to stay decoupled from auth.users' PK type.
CREATE TABLE IF NOT EXISTS rbac.role_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      VARCHAR(64)  NOT NULL,
    role_id      UUID NOT NULL REFERENCES rbac.roles(id) ON DELETE CASCADE,
    tenant_id    UUID NOT NULL REFERENCES rbac.tenants(id) ON DELETE CASCADE,
    scope_type   VARCHAR(20)  NOT NULL CHECK (scope_type IN ('platform','country','organization')),
    -- concrete scope the grant applies to: the org id, country code, or '*'/platform.
    scope_id     VARCHAR(128) NOT NULL DEFAULT '*',
    granted_by   VARCHAR(64),
    status       VARCHAR(16)  NOT NULL DEFAULT 'active',
    expires_at   TIMESTAMPTZ,
    attributes   JSONB        NOT NULL DEFAULT '{}',
    metadata     JSONB        NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_id, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_assign_user   ON rbac.role_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_assign_role   ON rbac.role_assignments (role_id);
CREATE INDEX IF NOT EXISTS idx_assign_tenant ON rbac.role_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assign_scope  ON rbac.role_assignments (scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_assign_status ON rbac.role_assignments (status);
