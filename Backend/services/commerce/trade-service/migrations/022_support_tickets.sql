-- 022 — Support / ticketing module (Phase 1 Buyer workspace).
--
-- Self-service support ticketing for buyers (billing/technical/account/trade-dispute
-- questions), optionally linked back to the order/RFQ/shipment it concerns, with a
-- threaded reply log.
--
-- Two tables in schema `tradeops`:
--   • support_tickets          — TENANT-SCOPED, RLS. status walks open →
--                                 in_progress → resolved → closed.
--   • support_ticket_messages  — TENANT-SCOPED, RLS, append-only thread replies.
--
-- Design guarantees (mirror 008…021):
--   • Tenant isolation — RLS fail-closed on both tables.
--   • migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
--     bodies; every RLS policy is written explicitly per table.

CREATE TABLE IF NOT EXISTS tradeops.support_tickets (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            text          NOT NULL DEFAULT 'T-DEMO',
    created_by_user_id   text,
    created_by_org_id    text,
    subject              text          NOT NULL,
    description          text,
    category             text,
    priority             text          NOT NULL DEFAULT 'medium',
    status               text          NOT NULL DEFAULT 'open',
    related_entity_type  text,
    related_entity_id    text,
    resolved_at          timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_support_tickets_priority CHECK (priority IN ('low','medium','high','urgent')),
    CONSTRAINT chk_support_tickets_status CHECK (status IN ('open','in_progress','resolved','closed'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON tradeops.support_tickets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_creator ON tradeops.support_tickets (tenant_id, created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_brin   ON tradeops.support_tickets USING brin (created_at);

ALTER TABLE tradeops.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.support_tickets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.support_tickets;
CREATE POLICY tenant_isolation ON tradeops.support_tickets
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.support_ticket_messages (
    id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        text          NOT NULL DEFAULT 'T-DEMO',
    ticket_id        uuid          NOT NULL,
    author_user_id   text,
    author_role      text,
    body             text          NOT NULL,
    created_at       timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_support_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tradeops.support_tickets (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON tradeops.support_ticket_messages (ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_tenant ON tradeops.support_ticket_messages (tenant_id);

ALTER TABLE tradeops.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.support_ticket_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.support_ticket_messages;
CREATE POLICY tenant_isolation ON tradeops.support_ticket_messages
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
