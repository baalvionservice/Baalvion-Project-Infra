-- 017_tenant_security.down.sql — rollback for 017_tenant_security.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_audit_logs_no_mutate ON public.audit_logs;
DROP FUNCTION IF EXISTS public.deny_audit_mutation();

DROP TABLE IF EXISTS public.api_key_scopes;

ALTER TABLE public.audit_logs
  DROP COLUMN IF EXISTS actor_user_id,
  DROP COLUMN IF EXISTS actor_api_key_id,
  DROP COLUMN IF EXISTS actor_type,
  DROP COLUMN IF EXISTS entity_uuid,
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS user_agent,
  DROP COLUMN IF EXISTS details;

ALTER TABLE public.sessions
  DROP COLUMN IF EXISTS last_seen_at,
  DROP COLUMN IF EXISTS token_version;
DROP INDEX IF EXISTS public.uq_sessions_refresh_hash;
DROP INDEX IF EXISTS public.idx_sessions_user_id;
DROP INDEX IF EXISTS public.idx_sessions_org_user;

ALTER TABLE public.api_keys
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS last_used_at,
  DROP COLUMN IF EXISTS last_used_ip,
  DROP COLUMN IF EXISTS rate_limit_per_min;
DROP INDEX IF EXISTS public.idx_api_keys_key_hash;

ALTER TABLE public.org_memberships
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_by;
DROP INDEX IF EXISTS public.uq_org_memberships_org_user;
DROP INDEX IF EXISTS public.idx_org_memberships_user_id;
DROP INDEX IF EXISTS public.idx_org_memberships_status;

ALTER TABLE public.users DROP COLUMN IF EXISTS token_version;

COMMIT;
