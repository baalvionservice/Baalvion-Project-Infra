-- Durable outbox for the deal-room audit trail.
--
-- Audit events were posted to audit-service fire-and-forget: if that service was down, restarting,
-- or simply slow, the event was written to stdout and lost. For a negotiation the trail IS the
-- evidence — who unlocked the data room, who moved the terms, who released the money — so "best
-- effort" is the wrong delivery guarantee. Events land here first and a relay drains them, so a
-- sink outage delays the trail instead of shredding it.
--
-- Deliberately NOT tenant-scoped: an audit row records who did something, and filtering it by the
-- actor's own tenant would let a tenant's own RLS context hide its own trail. The table is
-- written by the service and read only by the relay; no user-facing route exposes it.

BEGIN;
SET search_path TO marketplace, public;

CREATE TABLE IF NOT EXISTS marketplace.audit_outbox (
  id            BIGSERIAL PRIMARY KEY,
  payload       JSONB       NOT NULL,
  status        VARCHAR(12) NOT NULL DEFAULT 'pending',   -- pending|sent|failed
  attempts      INT         NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at  TIMESTAMPTZ
);

-- The relay's hot path: oldest undelivered first.
CREATE INDEX IF NOT EXISTS idx_audit_outbox_pending
    ON marketplace.audit_outbox (created_at)
    WHERE status <> 'sent';

COMMIT;
