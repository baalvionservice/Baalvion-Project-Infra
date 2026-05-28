-- 025_financial_operations.down.sql — rollback

BEGIN;

DROP TABLE IF EXISTS public.erp_exports;
DROP TABLE IF EXISTS public.enterprise_invoice_meta;
DROP TABLE IF EXISTS public.auto_recharge_configs;
DROP TABLE IF EXISTS public.refunds;
DROP TABLE IF EXISTS public.tax_exemptions;
DROP TABLE IF EXISTS public.tax_rates;
DROP TABLE IF EXISTS public.reconciliation_discrepancies;
DROP TABLE IF EXISTS public.reconciliation_runs;
DROP TABLE IF EXISTS public.profitability_snapshots;
DROP TABLE IF EXISTS public.cost_attributions;
DROP TABLE IF EXISTS public.infra_costs;
DROP TABLE IF EXISTS public.provider_contracts;
DROP TABLE IF EXISTS public.provider_cost_models;

ALTER TABLE public.credit_ledger
  DROP COLUMN IF EXISTS entry_type,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS expired;

COMMIT;
