-- 025_financial_operations.sql
-- Financial operations + revenue intelligence: rich provider cost models +
-- contracts, infrastructure cost attribution, profitability snapshots, usage +
-- provider reconciliation, jurisdiction-aware tax, prepaid/postpaid accounting
-- (refunds, auto-recharge, credit expiration), and ERP export bookkeeping.
-- Extends (does not replace) migration 019. Reuses public.deny_audit_mutation()
-- (017) for append-only finance audit; billing_audit_logs remains the signed log.

BEGIN;

-- ── 1) Rich provider cost models (beyond per-GB) ──────────────────────────────
-- model_type: per_gb | per_ip | per_asn | geo | concurrency | request
CREATE TABLE IF NOT EXISTS public.provider_cost_models (
  id             BIGSERIAL PRIMARY KEY,
  provider       TEXT NOT NULL,
  model_type     TEXT NOT NULL,
  dim_key        TEXT NOT NULL DEFAULT '',   -- country/asn/'' depending on model_type
  unit_cost      NUMERIC NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_cost_models ON public.provider_cost_models (provider, model_type, dim_key, effective_from DESC);

-- Enterprise provider contracts: commits, included volume, tiered volume discounts.
CREATE TABLE IF NOT EXISTS public.provider_contracts (
  id               BIGSERIAL PRIMARY KEY,
  provider         TEXT NOT NULL,
  tier             TEXT NOT NULL DEFAULT 'standard',
  monthly_commit   NUMERIC NOT NULL DEFAULT 0,   -- minimum spend ($)
  included_gb      NUMERIC NOT NULL DEFAULT 0,
  overage_per_gb   NUMERIC NOT NULL DEFAULT 0,
  min_charge       NUMERIC NOT NULL DEFAULT 0,
  volume_discounts JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{thresholdGb, discountPct}]
  currency         TEXT NOT NULL DEFAULT 'USD',
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_provider_contracts ON public.provider_contracts (provider, starts_at DESC);

-- ── 2) Infrastructure costs (ingested from cloud billing) + attribution ────────
-- category: k8s | bandwidth | edge | compute | storage | kafka | clickhouse | nat
CREATE TABLE IF NOT EXISTS public.infra_costs (
  id            BIGSERIAL PRIMARY KEY,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  category      TEXT NOT NULL,
  region        TEXT NOT NULL DEFAULT '',
  amount        NUMERIC NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  source        TEXT NOT NULL DEFAULT 'manual',  -- aws-cur | gcp | opencost | manual
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_infra_costs_period ON public.infra_costs (period_start, category, region);

-- Computed attribution of infra + provider cost to a scope.
CREATE TABLE IF NOT EXISTS public.cost_attributions (
  id            BIGSERIAL PRIMARY KEY,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  scope         TEXT NOT NULL,   -- org | region | product | enterprise_account
  entity_id     TEXT NOT NULL,
  provider_cost NUMERIC NOT NULL DEFAULT 0,
  infra_cost    NUMERIC NOT NULL DEFAULT 0,
  total_cost    NUMERIC NOT NULL DEFAULT 0,
  basis         JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {gb, requests, sessions, share}
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cost_attr ON public.cost_attributions (period_start, scope, entity_id);

-- ── 3) Profitability snapshots (revenue − cost − tax) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.profitability_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  scope         TEXT NOT NULL,   -- org | region | provider | asn | enterprise_account | platform
  entity_id     TEXT NOT NULL,
  revenue       NUMERIC NOT NULL DEFAULT 0,
  provider_cost NUMERIC NOT NULL DEFAULT 0,
  infra_cost    NUMERIC NOT NULL DEFAULT 0,
  tax           NUMERIC NOT NULL DEFAULT 0,
  gross_margin  NUMERIC NOT NULL DEFAULT 0,
  net_margin    NUMERIC NOT NULL DEFAULT 0,
  margin_ratio  NUMERIC NOT NULL DEFAULT 0,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_profitability ON public.profitability_snapshots (period_start, scope, entity_id);
CREATE INDEX IF NOT EXISTS idx_profitability_margin ON public.profitability_snapshots (scope, margin_ratio);

-- ── 4) Reconciliation runs + discrepancies ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id            BIGSERIAL PRIMARY KEY,
  kind          TEXT NOT NULL,   -- usage | provider | invoice
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'running',
  sources       JSONB NOT NULL DEFAULT '[]'::jsonb,
  discrepancies INTEGER NOT NULL DEFAULT 0,
  max_variance  NUMERIC NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.reconciliation_discrepancies (
  id             BIGSERIAL PRIMARY KEY,
  run_id         BIGINT NOT NULL REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
  dimension      TEXT NOT NULL,   -- org | provider | invoice
  dim_key        TEXT NOT NULL,
  source_a       TEXT NOT NULL,
  value_a        NUMERIC NOT NULL,
  source_b       TEXT NOT NULL,
  value_b        NUMERIC NOT NULL,
  variance       NUMERIC NOT NULL,
  variance_pct   NUMERIC NOT NULL,
  classification TEXT NOT NULL,   -- ok | mismatch | lost_events | overbilling | underbilling
  resolved       BOOLEAN NOT NULL DEFAULT false,
  adjustment_id  BIGINT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recon_disc_run ON public.reconciliation_discrepancies (run_id, classification);

-- ── 5) Jurisdiction-aware tax ─────────────────────────────────────────────────
-- tax_type: gst | igst | cgst | sgst | vat | sales
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id             BIGSERIAL PRIMARY KEY,
  country        TEXT NOT NULL,
  region         TEXT NOT NULL DEFAULT '',   -- state / province (sales tax, intra-state GST)
  tax_type       TEXT NOT NULL,
  rate           NUMERIC NOT NULL,           -- fraction, e.g. 0.18
  b2b_reverse    BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tax_rates ON public.tax_rates (country, region, effective_from DESC);

CREATE TABLE IF NOT EXISTS public.tax_exemptions (
  org_id          UUID PRIMARY KEY,
  country         TEXT,
  tax_id          TEXT,                       -- VAT/GSTIN/EIN
  exempt          BOOLEAN NOT NULL DEFAULT false,
  reverse_charge  BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6) Prepaid/postpaid accounting (extend credit_ledger + refunds + recharge) ─
ALTER TABLE public.credit_ledger
  ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'credit',  -- credit|consumption|refund|adjustment|expiration|accrual
  ADD COLUMN IF NOT EXISTS currency   TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired    BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_expiry ON public.credit_ledger (org_id, expires_at) WHERE expires_at IS NOT NULL AND NOT expired;

CREATE TABLE IF NOT EXISTS public.refunds (
  id            BIGSERIAL PRIMARY KEY,
  org_id        UUID NOT NULL,
  invoice_id    BIGINT,
  amount        NUMERIC NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|approved|rejected|processed
  risk_score    NUMERIC,
  requested_by  TEXT,
  approved_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refunds_org ON public.refunds (org_id, status);

CREATE TABLE IF NOT EXISTS public.auto_recharge_configs (
  org_id          UUID PRIMARY KEY,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  threshold       NUMERIC NOT NULL DEFAULT 0,   -- recharge when balance < threshold
  recharge_amount NUMERIC NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7) Enterprise invoice metadata (PO, terms, cost centers, approvals) ────────
CREATE TABLE IF NOT EXISTS public.enterprise_invoice_meta (
  invoice_id      BIGINT PRIMARY KEY REFERENCES public.invoices(id) ON DELETE CASCADE,
  po_number       TEXT,
  payment_terms   TEXT NOT NULL DEFAULT 'net30',  -- net30|net60|net90|due_on_receipt
  cost_center_id  UUID,
  department      TEXT,
  approval_status TEXT NOT NULL DEFAULT 'none',    -- none|pending|approved|rejected
  approved_by     TEXT,
  pdf_uri         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8) ERP export bookkeeping ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.erp_exports (
  id           BIGSERIAL PRIMARY KEY,
  system       TEXT NOT NULL,   -- quickbooks|xero|zoho|netsuite|sap|csv
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  format       TEXT NOT NULL,
  entry_count  INTEGER NOT NULL DEFAULT 0,
  total_debits NUMERIC NOT NULL DEFAULT 0,
  total_credits NUMERIC NOT NULL DEFAULT 0,
  checksum     TEXT,
  exported_by  TEXT,
  exported_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
