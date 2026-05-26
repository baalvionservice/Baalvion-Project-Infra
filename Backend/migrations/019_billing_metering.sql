-- 019_billing_metering.sql
-- Control-plane billing: usage-invoice support, prepaid credits, provider costs,
-- billing runs, quota overrides, and an immutable signed billing audit log.
-- (Time-series usage lives in TimescaleDB — see Backend/timeseries/001_*.sql.)

BEGIN;

-- 1) Invoices: support usage invoices that aren't tied to a subscription.
ALTER TABLE public.invoices ALTER COLUMN user_id        DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN subscription_id DROP NOT NULL;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS period_start     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kind             TEXT NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS total_gb         NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency         TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS signature        TEXT,
  ADD COLUMN IF NOT EXISTS dunning_attempts INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_invoices_org_period ON public.invoices (org_id, period_start);

-- 2) Prepaid credit ledger (balance = SUM(amount); credits +, consumption -).
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL,
  amount         NUMERIC NOT NULL,
  reason         TEXT NOT NULL,
  ref_invoice_id BIGINT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_org ON public.credit_ledger (org_id);

-- 3) Invoice line items.
CREATE TABLE IF NOT EXISTS public.usage_charges (
  id          BIGSERIAL PRIMARY KEY,
  invoice_id  BIGINT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL,
  kind        TEXT NOT NULL,
  description TEXT,
  quantity    NUMERIC NOT NULL DEFAULT 0,
  unit_price  NUMERIC NOT NULL DEFAULT 0,
  amount      NUMERIC NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_charges_invoice ON public.usage_charges (invoice_id);

-- 4) Provider cost config ($/GB, optional per-country). Operator-imported;
--    intentionally NOT seeded (real costs only).
CREATE TABLE IF NOT EXISTS public.provider_costs (
  id             BIGSERIAL PRIMARY KEY,
  provider       TEXT NOT NULL,
  country        TEXT NOT NULL DEFAULT '',
  cost_per_gb    NUMERIC NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_costs_lookup ON public.provider_costs (provider, country, effective_from DESC);

-- 5) Billing run bookkeeping (idempotency + history for the monthly cron).
CREATE TABLE IF NOT EXISTS public.billing_runs (
  id              BIGSERIAL PRIMARY KEY,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  invoices_issued INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'running'
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_runs_period ON public.billing_runs (period_start, period_end);

-- 6) Per-org quota overrides (optional; falls back to plan config).
CREATE TABLE IF NOT EXISTS public.quota_overrides (
  org_id          UUID PRIMARY KEY,
  included_gb     NUMERIC,
  hard_ceiling_gb NUMERIC,
  overage_per_gb  NUMERIC,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) Immutable, signed billing audit log (append-only via 017's trigger fn).
CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID,
  invoice_id BIGINT,
  action     TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_audit_org ON public.billing_audit_logs (org_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_billing_audit_no_mutate ON public.billing_audit_logs;
CREATE TRIGGER trg_billing_audit_no_mutate
  BEFORE UPDATE OR DELETE ON public.billing_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.deny_audit_mutation();

COMMIT;
