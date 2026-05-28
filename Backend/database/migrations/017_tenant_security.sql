-- 017_tenant_security.sql
-- Tenant-isolation + auth hardening for the proxy-backend (public schema).
-- Replaces the runtime ALTER TABLE block previously in service/platformStore.js.

BEGIN;

-- 1) Per-user token version → enables "log out everywhere" / password-change
--    invalidation of all outstanding access tokens.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- 2) Organization membership lifecycle + integrity.
ALTER TABLE public.org_memberships
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_memberships_org_user
  ON public.org_memberships (org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id
  ON public.org_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_status
  ON public.org_memberships (status);

-- 3) API key hardening: name, status, expiry, usage tracking, per-key rate.
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expires_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_used_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_used_ip       INET,
  ADD COLUMN IF NOT EXISTS rate_limit_per_min INTEGER NOT NULL DEFAULT 600;

-- Auth hot path looks keys up by hash.
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys (key_hash);

-- 4) Normalized API key scopes.
CREATE TABLE IF NOT EXISTS public.api_key_scopes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  scope      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_key_scopes
  ON public.api_key_scopes (api_key_id, scope);
CREATE INDEX IF NOT EXISTS idx_api_key_scopes_api_key_id
  ON public.api_key_scopes (api_key_id);

-- 5) Sessions: secure lookup + revocation support.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_refresh_hash
  ON public.sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id  ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_user ON public.sessions (org_id, user_id);
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS last_seen_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- 6) Audit logs: support API-key actors, UUID entities, request context.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_user_id    BIGINT,
  ADD COLUMN IF NOT EXISTS actor_api_key_id UUID,
  ADD COLUMN IF NOT EXISTS actor_type       TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS entity_uuid      UUID,
  ADD COLUMN IF NOT EXISTS ip_address       INET,
  ADD COLUMN IF NOT EXISTS user_agent       TEXT,
  ADD COLUMN IF NOT EXISTS details          JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Legacy NOT NULL columns must accept machine actors and UUID entities.
ALTER TABLE public.audit_logs ALTER COLUMN admin_id  DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON public.audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user
  ON public.audit_logs (actor_user_id);

-- 7) Columns/tables formerly created at runtime by platformStore.runMigrations().
--    Folded here so application boot no longer performs DDL (schema-drift hazard
--    under multiple replicas). Idempotent.
ALTER TABLE public.proxies
  ADD COLUMN IF NOT EXISTS name     TEXT,
  ADD COLUMN IF NOT EXISTS protocol TEXT DEFAULT 'http',
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS type         TEXT DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS success_rate DECIMAL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS latency      INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_slug              TEXT,
  ADD COLUMN IF NOT EXISTS enforcement_mode       TEXT DEFAULT 'pay-as-you-go',
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.abuse_logs
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS reason   TEXT;
CREATE TABLE IF NOT EXISTS public.presets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id),
  name       TEXT NOT NULL,
  type       TEXT,
  country    TEXT,
  protocol   TEXT DEFAULT 'http',
  rotation   TEXT DEFAULT 'rotating',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_presets_org_id ON public.presets(org_id);

-- 8) Append-only enforcement: block UPDATE/DELETE on audit_logs at the DB level.
CREATE OR REPLACE FUNCTION public.deny_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_no_mutate ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_mutate
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.deny_audit_mutation();

COMMIT;
