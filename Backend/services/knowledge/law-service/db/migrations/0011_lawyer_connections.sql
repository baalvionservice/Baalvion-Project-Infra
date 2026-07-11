-- 0011_lawyer_connections.sql — lawyer-to-lawyer networking (spec area 5):
-- follow, connect, and collaboration requests share one edge table, discriminated
-- by `relation`. Follows auto-accept; connect/collaborate require the addressee
-- to accept. Refer-cases is its own domain (legal.case_referrals, Phase 4).

CREATE TABLE IF NOT EXISTS legal.lawyer_connections (
    id             SERIAL PRIMARY KEY,
    requester_id   INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    addressee_id   INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    relation       VARCHAR(20) NOT NULL, -- follow | connect | collaborate
    status         VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | declined
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_lawyer_connections_requester ON legal.lawyer_connections (requester_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_connections_addressee ON legal.lawyer_connections (addressee_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_connections_relation ON legal.lawyer_connections (relation, status);
