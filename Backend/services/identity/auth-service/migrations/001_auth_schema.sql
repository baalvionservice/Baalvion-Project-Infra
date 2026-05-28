-- Baalvion Auth Service — Initial Schema
-- Run this once against baalvion_db before starting the service.
-- The service uses Sequelize sync({ alter: false }) so tables must exist first.

CREATE SCHEMA IF NOT EXISTS auth;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    full_name           TEXT,
    avatar_url          TEXT,
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    email_verified_at   TIMESTAMPTZ,
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret          TEXT,
    mfa_pending_secret  TEXT,
    recovery_codes      JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON auth.users (email);
CREATE INDEX IF NOT EXISTS idx_users_status ON auth.users (status);

-- ─── Organizations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    plan        VARCHAR(50) NOT NULL DEFAULT 'free',
    owner_id    BIGINT NOT NULL REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug     ON auth.organizations (slug);
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id ON auth.organizations (owner_id);

-- ─── Team Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.team_members (
    id           BIGSERIAL PRIMARY KEY,
    org_id       UUID NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
    user_id      BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role         VARCHAR(32) NOT NULL DEFAULT 'member',
    service_roles JSONB NOT NULL DEFAULT '{}',
    invited_by   BIGINT REFERENCES auth.users(id),
    joined_at    TIMESTAMPTZ,
    status       VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON auth.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id  ON auth.team_members (org_id);

-- ─── Invitations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(32) NOT NULL DEFAULT 'member',
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_by  BIGINT NOT NULL REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org_id     ON auth.invitations (org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON auth.invitations (token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_email      ON auth.invitations (email);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id       UUID REFERENCES auth.organizations(id) ON DELETE SET NULL,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    expires_at   TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON auth.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON auth.sessions (expires_at);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id  UUID NOT NULL REFERENCES auth.sessions(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_token_hash ON auth.refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_rt_user_id    ON auth.refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_rt_session_id ON auth.refresh_tokens (session_id);

-- ─── Password Resets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.password_resets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pw_resets_token_hash ON auth.password_resets (token_hash);
CREATE INDEX IF NOT EXISTS idx_pw_resets_user_id    ON auth.password_resets (user_id);

-- ─── Email Verifications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.email_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_token_hash ON auth.email_verifications (token_hash);
CREATE INDEX IF NOT EXISTS idx_ev_user_id    ON auth.email_verifications (user_id);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT REFERENCES auth.users(id) ON DELETE SET NULL,
    org_id        UUID REFERENCES auth.organizations(id) ON DELETE SET NULL,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id   VARCHAR(255),
    metadata      JSONB DEFAULT '{}',
    ip_address    VARCHAR(45),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id   ON auth.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_id    ON auth.audit_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON auth.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON auth.audit_logs (created_at DESC);
