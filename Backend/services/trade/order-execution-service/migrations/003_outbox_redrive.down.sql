-- Revert 003_outbox_redrive.sql.
BEGIN;

DROP INDEX IF EXISTS oms.idx_oes_outbox_failed;
ALTER TABLE oms.outbox_events DROP COLUMN IF EXISTS last_error;

COMMIT;
