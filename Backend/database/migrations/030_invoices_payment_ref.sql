-- 030_invoices_payment_ref.sql — DB-level exactly-once guarantee for paid invoices.
--
-- The authoritative webhook/fulfill path (proxy-service internalFulfillController + the four provider
-- webhook handlers) already nets one fulfillment per payment via public.payment_webhook_events (028).
-- This adds the cross-instance, restart-durable BACKSTOP at the invoice row itself: a stable per-payment
-- reference (the gateway payment id) plus a PARTIAL unique index. A provider redelivery, the browser's
-- optimistic /billing/activate call, and a JVM retry that all reach createInvoiceRecord for the SAME
-- payment now produce AT MOST ONE paid invoice — the prior 15-minute/amount heuristic was best-effort
-- and could not tell two genuinely-same-priced payments apart.
--
-- SAFE ON EXISTING DATA: payment_ref is added NULLABLE and every existing row is NULL, so the partial
-- index (WHERE payment_ref IS NOT NULL) covers no existing rows and cannot fail on apply. New paid
-- invoices written by the fulfillment path carry the ref and are deduped going forward. Offline/pending
-- (bank/wire) invoices have no gateway payment id → payment_ref stays NULL → exempt, as intended.
--
-- Apply as a one-shot like 028/029 (not auto-run on boot). Idempotent (IF NOT EXISTS throughout).
BEGIN;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_ref TEXT;

-- One paid (or any) invoice per (org, gateway payment id). Partial → existing NULL rows are exempt.
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_org_payment_ref
  ON public.invoices (org_id, payment_ref)
  WHERE payment_ref IS NOT NULL;

-- Runtime role grant already covers public.invoices for baalvion_app (DML), so no new grant is needed
-- for the column. Index usage requires no extra privilege. (Kept idempotent-safe per 027/028 precedent.)

COMMIT;
