-- admin-service :: support (ticketing) module
-- Self-provisioning DDL. This file documents the schema for clean deploys; the
-- runtime equivalent is executed idempotently (and memoized) by ensureSchema() in
-- service/supportService.js (no migration runner exists in this service).
--
-- Owns: the platform support desk for the admin console
-- (src/app/(dashboard)/support). Empty by default — no seed rows.

CREATE SCHEMA IF NOT EXISTS admin;

-- ── Tickets ─────────────────────────────────────────────────────────────────
-- requester (customer) identity is stored denormalized (email/name) because a
-- ticket may originate from a person who is not (yet) an auth.users row. user_id
-- / org_id are OPTIONAL soft references (no FK — support data must survive an
-- auth-side delete and admin-service does not own those tables).
CREATE TABLE IF NOT EXISTS admin.support_tickets (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number     TEXT         NOT NULL UNIQUE,
    subject           TEXT         NOT NULL,
    description       TEXT         NOT NULL DEFAULT '',
    status            TEXT         NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'escalated')),
    priority          TEXT         NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category          TEXT         NOT NULL DEFAULT 'other'
        CHECK (category IN ('billing', 'technical', 'account', 'security', 'feature_request', 'abuse', 'other')),
    requester_user_id UUID,
    requester_email   TEXT         NOT NULL,
    requester_name    TEXT         NOT NULL DEFAULT '',
    org_id            UUID,
    org_name          TEXT,
    assignee_id       UUID,
    assignee_name     TEXT,
    tags              JSONB        NOT NULL DEFAULT '[]'::jsonb,
    channel           TEXT         NOT NULL DEFAULT 'web',
    sla_deadline      TIMESTAMPTZ,
    sla_breached      BOOLEAN      NOT NULL DEFAULT FALSE,
    first_response_at TIMESTAMPTZ,
    resolved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON admin.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority   ON admin.support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee   ON admin.support_tickets (assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON admin.support_tickets (created_at DESC);

-- ── Messages ────────────────────────────────────────────────────────────────
-- author_type: 'agent' (support staff / admin) vs 'customer' (requester). The
-- console renders an 'agent'|'user'|'system' authorRole — 'customer' maps to
-- 'user' at the serializer boundary. internal=true notes are agent-only.
CREATE TABLE IF NOT EXISTS admin.support_messages (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID         NOT NULL REFERENCES admin.support_tickets(id) ON DELETE CASCADE,
    author_type TEXT         NOT NULL DEFAULT 'agent'
        CHECK (author_type IN ('agent', 'customer', 'system')),
    author_id   UUID,
    author_name TEXT         NOT NULL DEFAULT '',
    body        TEXT         NOT NULL,
    internal    BOOLEAN      NOT NULL DEFAULT FALSE,
    attachments JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket
    ON admin.support_messages (ticket_id, created_at ASC);

-- ── Macros (canned replies) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.support_macros (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT         NOT NULL,
    body        TEXT         NOT NULL,
    category    TEXT         NOT NULL DEFAULT 'general',
    usage_count INTEGER      NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_macros_created_at ON admin.support_macros (created_at DESC);
