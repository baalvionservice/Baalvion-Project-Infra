-- 023_edge_network.sql
-- Global edge network + owned-IP infrastructure: regions/PoPs, IP pools, owned
-- dedicated IPs + allocations, ASN intelligence, regional health.

BEGIN;

-- 1) Edge regions / PoPs.
CREATE TABLE IF NOT EXISTS public.edge_regions (
  code        TEXT PRIMARY KEY,                 -- us-east-1, eu-west-1, ap-south-1, ...
  name        TEXT NOT NULL,
  continent   TEXT,                             -- NA|SA|EU|IN|SEA|ME|AF|OC
  gateway_endpoint TEXT,                        -- regional NLB / Anycast endpoint
  lat         NUMERIC,
  lon         NUMERIC,
  weight      INTEGER NOT NULL DEFAULT 100,
  status      TEXT NOT NULL DEFAULT 'healthy',  -- healthy|degraded|offline
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) IP pools (datacenter/residential/mobile/isp; owned or upstream-backed).
CREATE TABLE IF NOT EXISTS public.ip_pools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,                    -- datacenter|residential|mobile|isp
  ip_version  INTEGER NOT NULL DEFAULT 4,       -- 4|6
  region_code TEXT REFERENCES public.edge_regions(code),
  provider    TEXT,                             -- 'owned' for our IPs, else upstream name
  asn         INTEGER,
  subnet      CIDR,
  rotation    TEXT NOT NULL DEFAULT 'static',   -- static|rotating
  reputation  NUMERIC NOT NULL DEFAULT 100,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ip_pools_region ON public.ip_pools (region_code, type);

-- 3) Owned dedicated IPs (the real inventory bound to edge nodes).
CREATE TABLE IF NOT EXISTS public.dedicated_ips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id     UUID NOT NULL REFERENCES public.ip_pools(id) ON DELETE CASCADE,
  ip          INET NOT NULL,
  asn         INTEGER,
  country     TEXT,
  region_code TEXT,
  reputation  NUMERIC NOT NULL DEFAULT 100,
  latency_ms  INTEGER,
  ban_rate    NUMERIC NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'available', -- available|allocated|quarantined
  allocated_org_id UUID,
  last_checked TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_dedicated_ip ON public.dedicated_ips (ip);
CREATE INDEX IF NOT EXISTS idx_dedicated_ip_pool ON public.dedicated_ips (pool_id, status);
CREATE INDEX IF NOT EXISTS idx_dedicated_ip_org ON public.dedicated_ips (allocated_org_id);

-- 4) Allocations (org → exclusive IPs / subnet, with SLA + geo).
CREATE TABLE IF NOT EXISTS public.ip_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  pool_id     UUID REFERENCES public.ip_pools(id),
  exclusive   BOOLEAN NOT NULL DEFAULT TRUE,
  ip_count    INTEGER NOT NULL DEFAULT 0,
  geo         TEXT,
  sla_tier    TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ip_alloc_org ON public.ip_allocations (org_id, revoked_at);

-- 5) ASN intelligence.
CREATE TABLE IF NOT EXISTS public.asn_intelligence (
  asn           INTEGER PRIMARY KEY,
  name          TEXT,
  country       TEXT,
  type          TEXT,                           -- residential|mobile|datacenter|hosting|business
  reputation    NUMERIC NOT NULL DEFAULT 100,
  ban_rate      NUMERIC NOT NULL DEFAULT 0,
  success_rate  NUMERIC,
  providers     JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_compat JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {domain: success_rate}
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asn_type ON public.asn_intelligence (type, reputation DESC);

-- 6) Regional health time-window (latest snapshot per region; trends in ClickHouse).
CREATE TABLE IF NOT EXISTS public.regional_health (
  id            BIGSERIAL PRIMARY KEY,
  region_code   TEXT NOT NULL,
  latency_ms    NUMERIC,
  saturation    NUMERIC,                        -- 0..1 capacity used
  active_tunnels INTEGER,
  success_rate  NUMERIC,
  status        TEXT,
  observed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regional_health ON public.regional_health (region_code, observed_at DESC);

COMMIT;
