-- agent-service schema — agents, commission plans, sales, commissions, training.
CREATE SCHEMA IF NOT EXISTS agent;

CREATE TABLE IF NOT EXISTS agent.commission_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        VARCHAR(128),
    name          VARCHAR(160) NOT NULL,
    type          VARCHAR(16) NOT NULL DEFAULT 'percent',
    rate          NUMERIC(8,5) NOT NULL DEFAULT 0,
    tiers         JSONB NOT NULL DEFAULT '[]',
    recurring_pct NUMERIC(8,5) NOT NULL DEFAULT 0,
    override_pcts JSONB NOT NULL DEFAULT '[]',
    currency      VARCHAR(8) NOT NULL DEFAULT 'USD',
    status        VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent.agents (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             VARCHAR(128),
    user_id            VARCHAR(64),
    code               VARCHAR(32) NOT NULL UNIQUE,
    name               VARCHAR(160) NOT NULL,
    email              VARCHAR(160),
    tier               VARCHAR(32) NOT NULL DEFAULT 'agent',
    status             VARCHAR(16) NOT NULL DEFAULT 'active',
    parent_agent_id    UUID REFERENCES agent.agents (id) ON DELETE SET NULL,
    commission_plan_id UUID REFERENCES agent.commission_plans (id) ON DELETE SET NULL,
    metadata           JSONB NOT NULL DEFAULT '{}',
    created_by         VARCHAR(64),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agent.agents (org_id);
CREATE INDEX IF NOT EXISTS idx_agents_parent ON agent.agents (parent_agent_id);

CREATE TABLE IF NOT EXISTS agent.agent_sales (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id     UUID NOT NULL REFERENCES agent.agents (id) ON DELETE CASCADE,
    org_id       VARCHAR(128),
    customer_ref VARCHAR(128),
    description  VARCHAR(255),
    amount       NUMERIC(16,2) NOT NULL,
    currency     VARCHAR(8) NOT NULL DEFAULT 'USD',
    kind         VARCHAR(16) NOT NULL DEFAULT 'new',
    status       VARCHAR(16) NOT NULL DEFAULT 'confirmed',
    period       VARCHAR(7),
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata     JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_agent ON agent.agent_sales (agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_period ON agent.agent_sales (period);

CREATE TABLE IF NOT EXISTS agent.commissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID NOT NULL REFERENCES agent.agents (id) ON DELETE CASCADE,
    org_id      VARCHAR(128),
    sale_id     UUID REFERENCES agent.agent_sales (id) ON DELETE SET NULL,
    plan_id     UUID,
    basis       VARCHAR(16) NOT NULL DEFAULT 'direct',
    level       INTEGER NOT NULL DEFAULT 0,
    amount      NUMERIC(16,2) NOT NULL,
    currency    VARCHAR(8) NOT NULL DEFAULT 'USD',
    period      VARCHAR(7),
    status      VARCHAR(16) NOT NULL DEFAULT 'accrued',
    approved_at TIMESTAMPTZ,
    paid_at     TIMESTAMPTZ,
    payout_ref  VARCHAR(128),
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_agent ON agent.commissions (agent_id);
CREATE INDEX IF NOT EXISTS idx_comm_status ON agent.commissions (status);
CREATE INDEX IF NOT EXISTS idx_comm_period ON agent.commissions (period);

CREATE TABLE IF NOT EXISTS agent.training_courses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        VARCHAR(128),
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    category      VARCHAR(80),
    required      BOOLEAN NOT NULL DEFAULT false,
    passing_score INTEGER NOT NULL DEFAULT 70,
    status        VARCHAR(16) NOT NULL DEFAULT 'published',
    created_by    VARCHAR(64),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent.training_modules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID NOT NULL REFERENCES agent.training_courses (id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    position     INTEGER NOT NULL DEFAULT 0,
    content_type VARCHAR(16) NOT NULL DEFAULT 'video',
    content_url  TEXT,
    body         TEXT,
    metadata     JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON agent.training_modules (course_id, position);

CREATE TABLE IF NOT EXISTS agent.agent_enrollments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id          UUID NOT NULL REFERENCES agent.agents (id) ON DELETE CASCADE,
    course_id         UUID NOT NULL REFERENCES agent.training_courses (id) ON DELETE CASCADE,
    org_id            VARCHAR(128),
    status            VARCHAR(16) NOT NULL DEFAULT 'enrolled',
    progress_pct      INTEGER NOT NULL DEFAULT 0,
    completed_modules JSONB NOT NULL DEFAULT '[]',
    score             INTEGER,
    certified_at      TIMESTAMPTZ,
    certificate_id    VARCHAR(48),
    enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (agent_id, course_id)
);
