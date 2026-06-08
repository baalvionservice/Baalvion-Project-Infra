-- 001_init.sql — order-execution-service owns the order lifecycle + outbox + saga.
-- F3: lives in its OWN schema `oms` (NOT `trade`) so it never collides with the
-- commerce trade-service's canonical integer-keyed trade.orders table.
-- Run as the privileged owner role (F4).
BEGIN;

CREATE SCHEMA IF NOT EXISTS oms;

CREATE TABLE IF NOT EXISTS oms.orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      text NOT NULL,
  deal_id        text,
  buyer_org_id   text,
  seller_org_id  text,
  lines          jsonb NOT NULL DEFAULT '[]',
  total_value    numeric(20,2) NOT NULL DEFAULT 0,
  currency       varchar(10) NOT NULL DEFAULT 'USD',
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','placed','payment_confirmed','in_fulfillment','shipped','delivered','closed','cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid'
                 CHECK (payment_status IN ('unpaid','pending','confirmed','failed','refunded')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oes_orders_tenant ON oms.orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_oes_orders_status ON oms.orders (status);

CREATE TABLE IF NOT EXISTS oms.outbox_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id   text NOT NULL,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL,
  status         text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
  attempts       int  NOT NULL DEFAULT 0,
  available_at   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  sent_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_oes_outbox_pending ON oms.outbox_events (status, available_at);

CREATE TABLE IF NOT EXISTS oms.processed_webhooks (
  webhook_id   text PRIMARY KEY,
  event_type   text NOT NULL,
  payload_hash text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oms.order_saga_state (
  order_id   text PRIMARY KEY,
  tenant_id  text NOT NULL,
  state      text NOT NULL,
  last_event text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- R1: RLS on the tenant-scoped order table. Infra tables (outbox/processed/saga)
-- carry tenant in-column and are written under bypass by the publisher/consumer.
ALTER TABLE oms.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms.orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON oms.orders;
CREATE POLICY tenant_isolation ON oms.orders
  USING ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)))
  WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)));

COMMIT;
