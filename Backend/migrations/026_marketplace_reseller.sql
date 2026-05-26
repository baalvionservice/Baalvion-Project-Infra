-- 026_marketplace_reseller.sql
-- Marketplace + reseller + white-label ecosystem: reseller hierarchy (master →
-- sub → customer), reseller pricing, affiliates + referrals + commissions,
-- payouts ledger, marketplace catalog + promotions + regional pricing + quotes,
-- partner contracts/KYB, and white-label custom domains. Builds on migration 022
-- (white_label_configs, oauth_apps, org_units, cost_centers) — extends, not replaces.

BEGIN;

-- ── 1) Reseller hierarchy ──────────────────────────────────────────────────────
-- A reseller IS an organization with a reseller profile. parent_reseller_id NULL = master.
CREATE TABLE IF NOT EXISTS public.reseller_orgs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL,                       -- the reseller's own organization
  parent_reseller_id UUID REFERENCES public.reseller_orgs(id) ON DELETE SET NULL,
  tier               TEXT NOT NULL DEFAULT 'reseller',    -- master | reseller | sub_reseller | affiliate
  status             TEXT NOT NULL DEFAULT 'pending',     -- pending | active | suspended | terminated
  margin_pct         NUMERIC NOT NULL DEFAULT 0,          -- reseller's retained margin (0..1)
  wholesale_discount NUMERIC NOT NULL DEFAULT 0,          -- off list price (0..1)
  quota_gb           NUMERIC,                             -- cap allocatable to its customers (NULL = unlimited)
  kyb_status         TEXT NOT NULL DEFAULT 'unverified',  -- unverified | pending | approved | rejected
  approved_by        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reseller_org ON public.reseller_orgs (org_id);
CREATE INDEX IF NOT EXISTS idx_reseller_parent ON public.reseller_orgs (parent_reseller_id);

-- A customer org belongs to at most one reseller (tenant isolation boundary).
CREATE TABLE IF NOT EXISTS public.reseller_customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id    UUID NOT NULL REFERENCES public.reseller_orgs(id) ON DELETE CASCADE,
  customer_org_id UUID NOT NULL,
  custom_pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  quota_gb       NUMERIC,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reseller_customer ON public.reseller_customers (customer_org_id);
CREATE INDEX IF NOT EXISTS idx_reseller_customers ON public.reseller_customers (reseller_id, status);

-- Per-reseller wholesale pricing tiers.
CREATE TABLE IF NOT EXISTS public.reseller_pricing (
  id           BIGSERIAL PRIMARY KEY,
  reseller_id  UUID NOT NULL REFERENCES public.reseller_orgs(id) ON DELETE CASCADE,
  product      TEXT NOT NULL,
  price_per_gb NUMERIC NOT NULL,
  included_gb  NUMERIC NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'USD',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reseller_pricing ON public.reseller_pricing (reseller_id, product, effective_from DESC);

-- Partner contracts / governance.
CREATE TABLE IF NOT EXISTS public.partner_contracts (
  id                  BIGSERIAL PRIMARY KEY,
  reseller_id         UUID NOT NULL REFERENCES public.reseller_orgs(id) ON DELETE CASCADE,
  terms               JSONB NOT NULL DEFAULT '{}'::jsonb,
  regional_restrictions TEXT[] NOT NULL DEFAULT '{}',
  audit_required      BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'draft',  -- draft | active | expired | terminated
  signed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2) Affiliates + referrals + commissions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID,
  email         TEXT,
  code          TEXT NOT NULL,                       -- referral code
  commission_pct NUMERIC NOT NULL DEFAULT 0.2,       -- one-time conversion %
  recurring_pct NUMERIC NOT NULL DEFAULT 0,          -- recurring revenue share %
  attribution_window_days INTEGER NOT NULL DEFAULT 30,
  payout_method TEXT NOT NULL DEFAULT 'manual',      -- stripe | razorpay | crypto | manual
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_code ON public.affiliates (code);

CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  referred_org_id UUID,
  visitor_id    TEXT,                                -- anonymous click id (cookie)
  ip_hash       TEXT,
  landed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending',     -- pending | converted | expired | rejected
  reject_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.referrals (affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_org ON public.referrals (referred_org_id);

-- Commissions accrued to a party (reseller or affiliate).
CREATE TABLE IF NOT EXISTS public.commissions (
  id            BIGSERIAL PRIMARY KEY,
  party_type    TEXT NOT NULL,                       -- reseller | affiliate
  party_id      UUID NOT NULL,
  source_invoice_id BIGINT,
  source_org_id UUID,
  basis         TEXT NOT NULL,                       -- recurring | usage | signup
  amount        NUMERIC NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  period        TEXT,
  status        TEXT NOT NULL DEFAULT 'accrued',     -- accrued | approved | paid | clawback
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commissions_party ON public.commissions (party_type, party_id, status);

-- ── 3) Payouts + ledger ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type    TEXT NOT NULL,
  party_id      UUID NOT NULL,
  amount        NUMERIC NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  method        TEXT NOT NULL DEFAULT 'manual',
  status        TEXT NOT NULL DEFAULT 'pending',     -- pending | hold | approved | processing | paid | failed
  hold_reason   TEXT,
  risk_score    NUMERIC,
  batch_id      TEXT,
  reference     TEXT,
  approved_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payouts_party ON public.payouts (party_type, party_id, status);

-- ── 4) Marketplace catalog + promotions + regional pricing + quotes ────────────
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,                          -- residential|mobile|datacenter|dedicated|geo|api|addon
  base_price  NUMERIC NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'gb',             -- gb|ip|month|request
  currency    TEXT NOT NULL DEFAULT 'USD',
  active      BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_sku ON public.marketplace_products (sku);

CREATE TABLE IF NOT EXISTS public.promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL,
  kind            TEXT NOT NULL,                       -- percent | fixed | bonus_gb
  value           NUMERIC NOT NULL,
  applies_to      TEXT NOT NULL DEFAULT 'all',         -- all | category:<c> | sku:<sku>
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ,
  max_redemptions INTEGER,
  redeemed        INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_code ON public.promotions (code);

CREATE TABLE IF NOT EXISTS public.regional_pricing (
  id          BIGSERIAL PRIMARY KEY,
  sku         TEXT NOT NULL,
  region      TEXT NOT NULL,                           -- country/region code
  multiplier  NUMERIC NOT NULL DEFAULT 1.0
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_regional_pricing ON public.regional_pricing (sku, region);

CREATE TABLE IF NOT EXISTS public.quotes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID,
  reseller_id  UUID,
  items        JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal     NUMERIC NOT NULL DEFAULT 0,
  discount     NUMERIC NOT NULL DEFAULT 0,
  total        NUMERIC NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'USD',
  status       TEXT NOT NULL DEFAULT 'draft',          -- draft | sent | accepted | expired
  valid_until  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5) White-label custom domains (extends white_label_configs from 022) ───────
CREATE TABLE IF NOT EXISTS public.white_label_domains (
  id            BIGSERIAL PRIMARY KEY,
  org_id        UUID NOT NULL,
  domain        TEXT NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT false,
  verify_token  TEXT,
  cert_status   TEXT NOT NULL DEFAULT 'pending',       -- pending | issued | failed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wl_domain_map ON public.white_label_domains (domain);

COMMIT;
