-- 029_proxy_public_schema_drift.down.sql
BEGIN;

ALTER TABLE IF EXISTS public.users
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS timezone,
  DROP COLUMN IF EXISTS oauth_provider,
  DROP COLUMN IF EXISTS oauth_provider_id,
  DROP COLUMN IF EXISTS avatar_url;

ALTER TABLE IF EXISTS public.abuse_logs       DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.api_keys         DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.audit_logs       DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.chargebacks      DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.notifications    DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.org_memberships  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.provider_health  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.refresh_tokens   DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.sessions         DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.sub_users        DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.system_incidents DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.ticket_messages  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.usage_records    DROP COLUMN IF EXISTS updated_at;
ALTER TABLE IF EXISTS public.webhook_logs     DROP COLUMN IF EXISTS updated_at;

COMMIT;
