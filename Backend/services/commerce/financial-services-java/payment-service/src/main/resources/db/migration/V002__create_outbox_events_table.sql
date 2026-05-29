-- Transactional outbox (design §9.3): events are written in the same tx as the
-- business change and drained to Kafka by a scheduled publisher.
CREATE TABLE payments.outbox_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  topic varchar(128) NOT NULL,
  event_key varchar(128),
  payload jsonb NOT NULL DEFAULT '{}',
  status varchar(16) NOT NULL DEFAULT 'PENDING',   -- PENDING, SENT, FAILED
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp NOT NULL,
  sent_at timestamp
);

-- Drives the publisher's "oldest PENDING first" drain query.
CREATE INDEX idx_outbox_status_created ON payments.outbox_events(status, created_at);

ALTER TABLE payments.outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY outbox_events_tenant_isolation ON payments.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
