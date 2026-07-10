-- 029_proxy_public_schema_drift.sql
-- Backfill columns the proxy-service Sequelize models declare but the generated base
-- schema (services/infrastructure/proxy-service/sql/schema.sql) lacks. Without these a
-- fresh public-schema provision fails at registration ("column \"company\" of relation
-- \"users\" does not exist") and on any model with timestamps:true that snapshots an
-- updated_at the dump omitted. All idempotent (ADD COLUMN IF NOT EXISTS).

BEGIN;

-- proxy users: profile + OAuth identity columns the model declares.
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS company           TEXT,
  ADD COLUMN IF NOT EXISTS timezone          TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS oauth_provider_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT;

-- updated_at on tables whose model uses Sequelize timestamps but whose dump omitted it.
ALTER TABLE IF EXISTS public.abuse_logs       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.api_keys         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.audit_logs       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.chargebacks      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.notifications    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.org_memberships  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.provider_health  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.refresh_tokens   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.sessions         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.sub_users        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.system_incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.ticket_messages  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.usage_records    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.webhook_logs     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMIT;
