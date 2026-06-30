-- Rollback 030_invoices_payment_ref.sql — drop the dedup index + column.
-- Safe: removing the index/column cannot corrupt existing invoice rows (payment_ref is advisory dedup
-- metadata, not part of any balance or total). The fulfillment path degrades to the 15-minute heuristic.
BEGIN;

DROP INDEX IF EXISTS public.uq_invoices_org_payment_ref;

ALTER TABLE public.invoices
  DROP COLUMN IF EXISTS payment_ref;

COMMIT;
