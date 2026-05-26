-- 018_auth_layer.sql
-- Developer/proxy authentication layer: API key environments, proxy sessions,
-- failed-attempt tracking, and high-volume auth audit log.

BEGIN;

-- 1) API key environment / type / metadata / rotation.
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS environment TEXT  NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS key_type    TEXT  NOT NULL DEFAULT 'api',
  ADD COLUMN IF NOT EXISTS metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rotated_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_api_keys_org_type ON public.api_keys (org_id, key_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys (expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON public.api_keys (revoked_at);

-- 2) Proxy sessions (sticky-session + concurrency + usage attribution surface).
CREATE TABLE IF NOT EXISTS public.proxy_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id),
  api_key_id    UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  session_token TEXT NOT NULL,
  customer      TEXT,
  zone          TEXT,
  country       TEXT,
  rotation      TEXT NOT NULL DEFAULT 'rotating',
  status        TEXT NOT NULL DEFAULT 'active',
  ip_address    INET,
  exit_ip       TEXT,
  bytes_in      BIGINT NOT NULL DEFAULT 0,
  bytes_out     BIGINT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ,
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proxy_sessions_org_id     ON public.proxy_sessions (org_id);
CREATE INDEX IF NOT EXISTS idx_proxy_sessions_api_key_id ON public.proxy_sessions (api_key_id);
CREATE INDEX IF NOT EXISTS idx_proxy_sessions_status     ON public.proxy_sessions (status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_proxy_sessions_org_token ON public.proxy_sessions (org_id, session_token);

-- 3) Failed auth attempts (brute-force forensics; live counters live in Redis).
CREATE TABLE IF NOT EXISTS public.failed_auth_attempts (
  id         BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  auth_type  TEXT,
  reason     TEXT,
  ip_address INET,
  org_id     UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_failed_auth_identifier ON public.failed_auth_attempts (identifier);
CREATE INDEX IF NOT EXISTS idx_failed_auth_created_at ON public.failed_auth_attempts (created_at);

-- 4) Auth audit log (high-volume success/failure telemetry, distinct from the
--    immutable business audit_logs).
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID,
  auth_type  TEXT NOT NULL,
  outcome    TEXT NOT NULL,
  reason     TEXT,
  api_key_id UUID,
  user_id    BIGINT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_org_id     ON public.auth_audit_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_outcome    ON public.auth_audit_logs (outcome);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit_logs (created_at);

COMMIT;
