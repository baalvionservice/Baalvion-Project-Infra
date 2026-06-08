-- 003_outbox_redrive.sql — recovery (redrive) support for the transactional outbox.
-- The reconciliation sweep DETECTS stuck PENDING / FAILED outbox rows; the redrive
-- worker RECOVERS them by re-publishing. To make redrive observable + bounded we
-- record the last failure reason. `attempts` already exists (001); this only adds
-- `last_error`. Additive + idempotent so it upgrades an existing oms.outbox_events
-- in place. Run as the privileged owner role (MIGRATION_DB_USER).
BEGIN;

ALTER TABLE oms.outbox_events ADD COLUMN IF NOT EXISTS last_error text;

-- Partial index so the redrive worker can cheaply find FAILED rows to retry
-- (separate from the PENDING/available_at index the relay already uses).
CREATE INDEX IF NOT EXISTS idx_oes_outbox_failed
  ON oms.outbox_events (status, available_at)
  WHERE status = 'FAILED';

-- Re-grant in case the column changes any default ACL expectations (idempotent).
GRANT SELECT, INSERT, UPDATE, DELETE ON oms.outbox_events TO baalvion_app;

COMMIT;
