-- Outbound webhook delivery (design §7.2): HMAC-SHA256-signed event callbacks with retry/DLQ.
CREATE TABLE finance_audit.webhook_subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  url varchar(512) NOT NULL,
  secret varchar(128) NOT NULL,
  event_pattern varchar(256),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint
);

CREATE INDEX idx_wh_sub_tenant_active ON finance_audit.webhook_subscriptions(tenant_id, active);

ALTER TABLE finance_audit.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wh_sub_tenant_isolation ON finance_audit.webhook_subscriptions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE TABLE finance_audit.webhook_deliveries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  url varchar(512) NOT NULL,
  event_type varchar(128) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status varchar(16) NOT NULL DEFAULT 'PENDING',   -- PENDING, DELIVERED, FAILED
  attempts integer NOT NULL DEFAULT 0,
  response_status integer,
  last_error text,
  next_attempt_at timestamp,
  delivered_at timestamp,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint
);

-- Drives the dispatcher's "due PENDING first" claim query (FOR UPDATE SKIP LOCKED).
CREATE INDEX idx_wh_del_due ON finance_audit.webhook_deliveries(status, next_attempt_at);
CREATE INDEX idx_wh_del_sub ON finance_audit.webhook_deliveries(subscription_id, created_at DESC);

ALTER TABLE finance_audit.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY wh_del_tenant_isolation ON finance_audit.webhook_deliveries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
