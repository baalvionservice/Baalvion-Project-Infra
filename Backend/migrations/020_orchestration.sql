-- 020_orchestration.sql
-- Provider orchestration control plane: encrypted credentials, geo/ASN
-- capabilities, IP intelligence, and routing policies. (Live provider health
-- is published to Redis by the gateway orchestrator; per-IP/provider analytics
-- live in ClickHouse — see Backend/clickhouse/001_*.sql.)

BEGIN;

-- Extend the existing providers table with orchestration fields.
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS kind          TEXT NOT NULL DEFAULT 'http',   -- http|https|socks5
  ADD COLUMN IF NOT EXISTS proxy_type    TEXT NOT NULL DEFAULT 'residential', -- residential|datacenter|isp|mobile
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_gb   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight        INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS state         TEXT NOT NULL DEFAULT 'HEALTHY',
  ADD COLUMN IF NOT EXISTS enabled       BOOLEAN NOT NULL DEFAULT TRUE;

-- Encrypted provider credentials (AES-256-GCM via service/cryptoVault.js).
CREATE TABLE IF NOT EXISTS public.provider_credentials (
  id                BIGSERIAL PRIMARY KEY,
  provider_id       BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  username_template TEXT NOT NULL,
  password_enc      TEXT NOT NULL,   -- encrypted
  api_token_enc     TEXT,            -- encrypted (optional usage API)
  usage_api_url     TEXT,
  rotated_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_credentials ON public.provider_credentials (provider_id);

-- Provider geo/ASN capability inventory.
CREATE TABLE IF NOT EXISTS public.provider_geo_capabilities (
  id          BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  country     TEXT NOT NULL,
  state       TEXT DEFAULT '',
  city        TEXT DEFAULT '',
  asn         INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_geo_caps ON public.provider_geo_capabilities (provider_id, country);

-- IP intelligence (slow-moving inventory; high-volume per-IP events go to ClickHouse).
CREATE TABLE IF NOT EXISTS public.ip_intelligence (
  ip            INET PRIMARY KEY,
  provider      TEXT,
  asn           INTEGER,
  country       TEXT,
  state         TEXT,
  city          TEXT,
  proxy_type    TEXT,
  latency_ms    INTEGER,
  success_rate  NUMERIC,
  ban_rate      NUMERIC,
  abuse_score   NUMERIC NOT NULL DEFAULT 0,
  health_score  NUMERIC NOT NULL DEFAULT 100,
  cost_per_gb   NUMERIC,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ejected_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ip_intel_provider ON public.ip_intelligence (provider);
CREATE INDEX IF NOT EXISTS idx_ip_intel_geo ON public.ip_intelligence (country, asn);
CREATE INDEX IF NOT EXISTS idx_ip_intel_health ON public.ip_intelligence (health_score);

-- Routing policies (admin-tunable strategy + overrides per plan/geo).
CREATE TABLE IF NOT EXISTS public.routing_policies (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  plan_slug    TEXT,                 -- NULL = global default
  strategy     TEXT NOT NULL DEFAULT 'cost_aware',
  country      TEXT,
  provider_allow JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_deny  JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority     INTEGER NOT NULL DEFAULT 100,
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routing_policies_plan ON public.routing_policies (plan_slug, priority DESC);

COMMIT;
