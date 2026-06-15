-- Transactional outbox for invoice domain events.
--
-- Invoice lifecycle transitions and recorded payments now write an outbox row in the SAME
-- transaction as the invoice mutation; the relay (OutboxRelay) drains PENDING rows to Kafka with
-- retry + backoff + dead-letter. This replaces the previous inline fire-and-forget
-- `kafkaTemplate.send` (swallowed exceptions, no retry, no durable record), which silently dropped
-- invoice events — including `invoice.payment.recorded` — whenever the broker was unreachable or the
-- process crashed mid-send.
--
-- NO RLS: the relay reads cross-tenant (FOR UPDATE SKIP LOCKED over all tenants), so this is a
-- relay-internal table isolated by the tenant_id column + owner-only grants — matching the suite's
-- other outbox/relay tables (ledger V003 dropped RLS on ledger_outbox for exactly this reason;
-- credit/aml/deal-room outbox tables never enable it).

CREATE TABLE IF NOT EXISTS invoice.outbox_events (
  id            uuid PRIMARY KEY,
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
  CONSTRAINT check_invoice_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

-- The relay claims rows ordered by availability; this index supports the claim scan.
CREATE INDEX IF NOT EXISTS idx_invoice_outbox_claim ON invoice.outbox_events (status, available_at);

-- Grant the non-superuser runtime role DML, mirroring V005's grant pattern for the invoice schema.
-- Role-guarded so it is safe on databases where baalvion_app has not been provisioned yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON invoice.outbox_events TO baalvion_app';
  END IF;
END$$;
