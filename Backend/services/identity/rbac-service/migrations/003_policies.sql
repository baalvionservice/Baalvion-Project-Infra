-- Baalvion RBAC Service — Phase 3: ABAC policy engine (the PDP datastore).
-- Policies are attribute-based rules evaluated dynamically to decide allow/deny
-- and to attach obligations (e.g. limit/mask/require_mfa). They compose WITH the
-- RBAC permission grants from Phase 2 under a deny-overrides strategy.

CREATE SCHEMA IF NOT EXISTS rbac;

-- ─── Policies ─────────────────────────────────────────────────────────────────
-- target  : which requests this policy applies to (actions/resources/roles/scopes).
-- condition: the attribute expression AST (subject.* / resource.* / action /
--            env.* / tenant.*) — see engine/conditionEvaluator.js for the grammar.
-- effect  : allow | deny. obligations: extra constraints returned to the PEP
--           (e.g. {"limit": {"rate": 100}}, {"mask": ["ssn"]}, {"require_mfa": true}).
-- priority: higher wins when ordering matters (deny still overrides allow).
CREATE TABLE IF NOT EXISTS rbac.policies (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- tenant_id NULL = global policy (applies to every tenant).
    tenant_id    UUID REFERENCES rbac.tenants(id) ON DELETE CASCADE,
    key          VARCHAR(120) NOT NULL,
    name         VARCHAR(160) NOT NULL,
    description  TEXT,
    effect       VARCHAR(8)   NOT NULL DEFAULT 'allow' CHECK (effect IN ('allow','deny')),
    priority     INTEGER      NOT NULL DEFAULT 100,
    target       JSONB        NOT NULL DEFAULT '{}',
    condition    JSONB        NOT NULL DEFAULT '{}',
    obligations  JSONB        NOT NULL DEFAULT '{}',
    status       VARCHAR(16)  NOT NULL DEFAULT 'active',
    version      INTEGER      NOT NULL DEFAULT 1,
    created_by   VARCHAR(64),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_policies_tenant   ON rbac.policies (tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_effect   ON rbac.policies (effect);
CREATE INDEX IF NOT EXISTS idx_policies_status   ON rbac.policies (status);
CREATE INDEX IF NOT EXISTS idx_policies_priority ON rbac.policies (priority DESC);

-- ─── Subject attributes ───────────────────────────────────────────────────────
-- Declared/cached attributes about a user that ABAC conditions read (department,
-- clearance, region, ...). Attributes can also arrive in the authorize request;
-- request-supplied attributes win over stored ones at evaluation time.
CREATE TABLE IF NOT EXISTS rbac.subject_attributes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(64)  NOT NULL,
    tenant_id  UUID REFERENCES rbac.tenants(id) ON DELETE CASCADE,
    key        VARCHAR(80)  NOT NULL,
    value      JSONB        NOT NULL DEFAULT 'null',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_subjattr_user ON rbac.subject_attributes (user_id);

-- ─── Decision logs ────────────────────────────────────────────────────────────
-- Audit trail of every PDP decision — what was asked, what was decided, and why.
CREATE TABLE IF NOT EXISTS rbac.decision_logs (
    id               BIGSERIAL PRIMARY KEY,
    user_id          VARCHAR(64),
    tenant_id        UUID,
    action           VARCHAR(120),
    resource         VARCHAR(160),
    scope_id         VARCHAR(128),
    decision         VARCHAR(8) NOT NULL CHECK (decision IN ('allow','deny')),
    reason           TEXT,
    matched_policy   VARCHAR(120),
    matched_role     VARCHAR(64),
    obligations      JSONB DEFAULT '{}',
    request          JSONB DEFAULT '{}',
    request_id       VARCHAR(64),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declog_user    ON rbac.decision_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_declog_created ON rbac.decision_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_declog_decision ON rbac.decision_logs (decision);
