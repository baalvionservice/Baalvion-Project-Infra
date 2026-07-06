-- 046 — Logistics Core Foundation, Phase 4: transactional event outbox.
--
-- Schema matches @baalvion/events' `createPgOutboxStore` contract exactly
-- (packages/events/src/pgOutboxStore.ts `outboxTableDDL()`), with `org_id`
-- typed `text` instead of `uuid` to hold trade-service's tenant_id (often a
-- slug like 'T-DEMO', not always a UUID).
--
-- Deliberately NO RLS here, per that package's own documented design: "the
-- relay reads cross-tenant, so the table is relay-internal and isolated by
-- owner-only grants + the tenant-scoped org_id column" (same decision as the
-- Java finance suite's relay tables) — every other tradeops table in this
-- service has full RLS; this one is the sole, intentional exception.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies.

CREATE TABLE IF NOT EXISTS tradeops.event_outbox (
    id           uuid          PRIMARY KEY,
    type         varchar(160)  NOT NULL,
    payload      text          NOT NULL,
    org_id       text,
    status       varchar(16)   NOT NULL DEFAULT 'pending',
    attempts     integer       NOT NULL DEFAULT 0,
    last_error   text,
    available_at timestamptz   NOT NULL DEFAULT now(),
    created_at   timestamptz   NOT NULL DEFAULT now(),
    sent_at      timestamptz,
    CONSTRAINT chk_event_outbox_status CHECK (status IN ('pending','sent','failed'))
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_claim ON tradeops.event_outbox (status, available_at);
CREATE INDEX IF NOT EXISTS idx_event_outbox_org    ON tradeops.event_outbox (org_id);
