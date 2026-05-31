-- Baalvion RBAC Service — Phase 2: Permission layer (action-level permissions
-- mapped to roles). Permissions are a GLOBAL registry of "action on resource"
-- grants (e.g. cms.article:publish). role_permissions binds them to roles, with
-- an optional ABAC `constraints` expression that narrows the grant.

CREATE SCHEMA IF NOT EXISTS rbac;

-- ─── Permissions registry ─────────────────────────────────────────────────────
-- key is the canonical "<resource>:<action>" identifier. resource/action are also
-- stored split for querying. Wildcards allowed: resource '*' or action '*'.
CREATE TABLE IF NOT EXISTS rbac.permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(160) NOT NULL UNIQUE,
    resource    VARCHAR(120) NOT NULL,
    action      VARCHAR(60)  NOT NULL,
    description TEXT,
    -- which domain/app this permission belongs to (cms, commerce, dashboard, ...).
    module      VARCHAR(60),
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
    attributes  JSONB        NOT NULL DEFAULT '{}',
    metadata    JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (resource, action)
);

CREATE INDEX IF NOT EXISTS idx_perms_resource ON rbac.permissions (resource);
CREATE INDEX IF NOT EXISTS idx_perms_module   ON rbac.permissions (module);

-- ─── Role ⇄ Permission mapping ────────────────────────────────────────────────
-- effect lets a role explicitly DENY a permission (deny-overrides at decision time).
-- constraints is an optional ABAC condition (same AST as policies) that must hold
-- for the grant to apply — e.g. {"==":[ {"var":"resource.orgId"}, {"var":"subject.orgId"} ]}.
CREATE TABLE IF NOT EXISTS rbac.role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES rbac.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES rbac.permissions(id) ON DELETE CASCADE,
    effect        VARCHAR(8) NOT NULL DEFAULT 'allow' CHECK (effect IN ('allow','deny')),
    constraints   JSONB      NOT NULL DEFAULT '{}',
    created_by    VARCHAR(64),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_perms_role ON rbac.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_perm ON rbac.role_permissions (permission_id);
