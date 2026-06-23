-- Payment Consistency Layer — core schema.
--
-- Three tables, one bounded context. All idempotent (IF NOT EXISTS) so it is safe to run
-- in shadow mode alongside the legacy payment tables and re-run during rollout.
--
--   pcl.payment_state   — the single source of truth for charge state (one row per paymentId)
--   pcl.payment_inbox   — exactly-once guard: (paymentId, eventType, transactionId) dedupe
--   pcl.payment_outbox  — transactional outbox; layout matches @baalvion/events outboxTableDDL
--                         so the existing relay (createPgOutboxStore + startOutboxRelay) drains it
--
-- No new infrastructure: this lives in the existing Postgres, reuses the existing Kafka/Redis
-- relay, and adds no service the platform doesn't already run.

CREATE SCHEMA IF NOT EXISTS pcl;

-- ── Source of truth ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pcl.payment_state (
  payment_id          varchar(190) PRIMARY KEY,
  provider            varchar(40)  NOT NULL,
  transaction_id      varchar(190) NOT NULL,
  amount_minor        bigint       NOT NULL,
  currency            char(3)      NOT NULL,
  state               varchar(16)  NOT NULL DEFAULT 'INITIATED',
  version             integer      NOT NULL DEFAULT 1,
  last_event_type     varchar(48),
  last_transaction_id varchar(190),
  org_id              varchar(190),
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT pcl_payment_state_state_chk
    CHECK (state IN ('INITIATED','AUTHORIZED','CAPTURED','SETTLED','FAILED'))
);
CREATE INDEX IF NOT EXISTS pcl_payment_state_org_state_idx ON pcl.payment_state (org_id, state);
CREATE INDEX IF NOT EXISTS pcl_payment_state_provider_txn_idx ON pcl.payment_state (provider, transaction_id);

COMMENT ON TABLE pcl.payment_state IS
  'PCL single source of truth for charge lifecycle. Mutated ONLY by PaymentStateMachine.apply().';

-- ── Exactly-once guard ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pcl.payment_inbox (
  dedupe_key     varchar(600) PRIMARY KEY,   -- "<paymentId>::<eventType>::<transactionId>"
  payment_id     varchar(190) NOT NULL,
  event_type     varchar(48)  NOT NULL,
  transaction_id varchar(190) NOT NULL,
  received_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pcl_payment_inbox_payment_idx ON pcl.payment_inbox (payment_id);

COMMENT ON TABLE pcl.payment_inbox IS
  'Idempotency ledger. UNIQUE dedupe_key makes the SAME event (duplicate webhook, redelivered '
  'Kafka message, repeated gateway poll) applied exactly once.';

-- ── Transactional outbox (relay-compatible with @baalvion/events) ─────────────────
CREATE TABLE IF NOT EXISTS pcl.payment_outbox (
  id           uuid PRIMARY KEY,
  type         varchar(160) NOT NULL,        -- PAYMENT_CAPTURED | PAYMENT_FAILED | PAYMENT_SETTLED | PAYMENT_AUTHORIZED | PAYMENT_CONFLICT
  payload      text         NOT NULL,        -- text (not jsonb) so the relay's JSON.parse round-trips a string
  org_id       varchar(190),
  status       varchar(16)  NOT NULL DEFAULT 'pending',
  attempts     int          NOT NULL DEFAULT 0,
  last_error   text,
  available_at timestamptz  NOT NULL DEFAULT now(),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  CONSTRAINT pcl_payment_outbox_status_chk CHECK (status IN ('pending','sent','failed'))
);
CREATE INDEX IF NOT EXISTS pcl_payment_outbox_claim_idx ON pcl.payment_outbox (status, available_at);

COMMENT ON TABLE pcl.payment_outbox IS
  'Side-effect outbox. Side effects (PAYMENT_CAPTURED/FAILED/SETTLED) are written here in the same '
  'transaction as the state change and published by the shared @baalvion/events relay. No service '
  'publishes Kafka or calls downstream systems directly.';
