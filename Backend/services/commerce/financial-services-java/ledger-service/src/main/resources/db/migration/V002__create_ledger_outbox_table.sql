-- Transactional outbox for ledger events.
--
-- Journal entries are committed POSTED/REVERSED atomically with a ledger_outbox row in the
-- SAME transaction. A separate relay (LedgerOutboxRelay) drains PENDING rows to Kafka
-- synchronously, so a committed entry can no longer diverge silently from downstream
-- (escrow/settlement) consumers. Same platform pattern as credit/aml/deal-room services.

CREATE TABLE ledger.ledger_outbox (
  id            uuid PRIMARY KEY,
  aggregate_id  uuid NOT NULL,
  tenant_id     uuid NOT NULL,
  topic         varchar(128) NOT NULL,
  msg_key       varchar(128),
  payload       jsonb NOT NULL DEFAULT '{}',
  status        varchar(20) NOT NULL DEFAULT 'PENDING',
  attempts      int NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamp NOT NULL DEFAULT now(),
  available_at  timestamp NOT NULL DEFAULT now(),
  sent_at       timestamp,
  CONSTRAINT check_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

-- The relay claims rows ordered by availability; this index supports the claim scan.
CREATE INDEX idx_ledger_outbox_claim ON ledger.ledger_outbox (status, available_at);

-- RLS for multi-tenancy, mirroring journal_entries. The relay reads cross-tenant, so it must
-- run under a role that bypasses RLS (table owner / BYPASSRLS); the write path always inserts
-- with the current tenant, satisfying WITH CHECK.
ALTER TABLE ledger.ledger_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_outbox_tenant_isolation ON ledger.ledger_outbox
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
