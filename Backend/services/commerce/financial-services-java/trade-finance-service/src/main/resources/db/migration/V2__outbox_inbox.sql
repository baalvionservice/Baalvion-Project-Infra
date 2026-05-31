-- Transactional outbox (events written in the same txn as the business change) + inbox
-- (exactly-once consumption). Mirrors the platform pattern used by payment/account services.

CREATE TABLE IF NOT EXISTS trade_finance.outbox_events (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  topic           VARCHAR(128) NOT NULL,
  event_key       VARCHAR(128),
  payload         JSONB NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  sent_at         TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tf_outbox_status_created
  ON trade_finance.outbox_events (status, created_at);

CREATE TABLE IF NOT EXISTS trade_finance.processed_events (
  event_id      UUID PRIMARY KEY,
  event_type    VARCHAR(128),
  processed_at  TIMESTAMP NOT NULL DEFAULT now()
);
