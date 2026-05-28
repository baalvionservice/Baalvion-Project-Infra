-- 019_billing_metering.down.sql — rollback for 019_billing_metering.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_billing_audit_no_mutate ON public.billing_audit_logs;
DROP TABLE IF EXISTS public.billing_audit_logs;
DROP TABLE IF EXISTS public.quota_overrides;
DROP TABLE IF EXISTS public.billing_runs;
DROP TABLE IF EXISTS public.provider_costs;
DROP TABLE IF EXISTS public.usage_charges;
DROP TABLE IF EXISTS public.credit_ledger;

ALTER TABLE public.invoices
  DROP COLUMN IF EXISTS period_start,
  DROP COLUMN IF EXISTS period_end,
  DROP COLUMN IF EXISTS kind,
  DROP COLUMN IF EXISTS total_gb,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS signature,
  DROP COLUMN IF EXISTS dunning_attempts;
-- NOTE: user_id / subscription_id are left nullable (re-imposing NOT NULL could
-- fail if usage invoices exist). Re-add manually if rolling back fully.

COMMIT;
