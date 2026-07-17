-- Migration 031: Community Service (Market Underworld multi-community forum) — full schema
-- Run once against baalvion_db after migration 030.
--
-- Backs the real multi-community forum on community.marketunderworld.com/forum. This service
-- owns membership/RBAC/invites/paid-tiers only — NodeBB (a separate, already-deployed
-- system, see deploy/consolidated/caddy/Caddyfile) remains the system of record for the
-- actual threads/posts/replies. communities.nodebb_* columns bridge the two: this table
-- decides WHO gets access, then community-service's nodebbClient grants/revokes the
-- corresponding NodeBB group membership.
--
-- Billing (checkout/fulfill) columns are reserved now (tier/amount_usd/currency/payment_ref)
-- but not yet wired end-to-end — see plan MVP scope (free/invite/request-to-join ship first).

CREATE SCHEMA IF NOT EXISTS community;

-- ─── Communities ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community.communities (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                 VARCHAR(80)  NOT NULL UNIQUE,
    name                 VARCHAR(160) NOT NULL,
    description          TEXT,
    access_model         VARCHAR(20)  NOT NULL DEFAULT 'free'
                         CHECK (access_model IN ('free','invite_only','request_approval','paid')),
    nodebb_cid           INTEGER,
    nodebb_group_member  VARCHAR(160),
    nodebb_group_paid    VARCHAR(160),
    nodebb_group_mod     VARCHAR(160),
    is_active            BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_communities_active ON community.communities (is_active);

-- ─── Memberships ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community.community_memberships (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id   UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL,
    role           VARCHAR(20) NOT NULL DEFAULT 'member'
                   CHECK (role IN ('member','moderator','admin')),
    status         VARCHAR(20) NOT NULL DEFAULT 'requested'
                   CHECK (status IN ('invited','requested','approved','paid','rejected','banned','cancelled','expired')),
    tier           VARCHAR(40),
    amount_usd     NUMERIC(10,2),
    currency       VARCHAR(10),
    payment_ref    VARCHAR(160),
    started_at     TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user   ON community.community_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_status ON community.community_memberships (status);

-- ─── Invites ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community.community_invites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id        UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
    invited_by_user_id  UUID NOT NULL,
    invited_email       VARCHAR(320),
    token               VARCHAR(64) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','redeemed','revoked','expired')),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community.community_invites (community_id);

-- ─── Join Requests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community.community_join_requests (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id          UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
    user_id               UUID NOT NULL,
    message               TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
    reviewed_by_user_id   UUID,
    reviewed_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_status
    ON community.community_join_requests (community_id, status);

-- ─── Moderation Logs ────────────────────────────────────────────────────────────
-- Fast local query path; every write here is ALSO fire-and-forget emitted onto the
-- platform's baalvion:events Redis Streams bus for audit-service's tamper-evident record
-- (community-service's service/eventsClient.js) — additive, not a replacement.
CREATE TABLE IF NOT EXISTS community.community_moderation_logs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id         UUID REFERENCES community.communities(id) ON DELETE SET NULL,
    actor_user_id         UUID NOT NULL,
    action                VARCHAR(80) NOT NULL,
    target_user_id        UUID,
    target_entity_type    VARCHAR(40),
    target_entity_id      VARCHAR(80),
    details               JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_moderation_logs_community ON community.community_moderation_logs (community_id, created_at DESC);

-- ─── Seed communities (extensible via admin API later — not a hardcoded final list) ────
INSERT INTO community.communities (slug, name, description, access_model) VALUES
    ('general',             'General Discussion',          'Open discussion for the whole Market Underworld community.', 'free'),
    ('cybersecurity',       'Cybersecurity & Ethical Hacking', 'Legal, defensive-security and ethical-hacking discussion — CTFs, research, tooling.', 'request_approval'),
    ('education',           'Education & Mentorship',      'Learning resources, study groups, and mentorship.', 'free'),
    ('investors-founders',  'Investors & Founders',        'Vetted community for investors and startup founders.', 'invite_only'),
    ('trading-markets',     'Trading & Markets',           'Markets discussion; a paid deep-dive tier is reserved for a later pass.', 'free')
ON CONFLICT (slug) DO NOTHING;
