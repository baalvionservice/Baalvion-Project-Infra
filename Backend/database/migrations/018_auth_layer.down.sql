-- 018_auth_layer.down.sql — rollback for 018_auth_layer.sql

BEGIN;

DROP TABLE IF EXISTS public.auth_audit_logs;
DROP TABLE IF EXISTS public.failed_auth_attempts;
DROP TABLE IF EXISTS public.proxy_sessions;

DROP INDEX IF EXISTS public.idx_api_keys_org_type;
DROP INDEX IF EXISTS public.idx_api_keys_expires_at;
DROP INDEX IF EXISTS public.idx_api_keys_revoked_at;

ALTER TABLE public.api_keys
  DROP COLUMN IF EXISTS environment,
  DROP COLUMN IF EXISTS key_type,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS rotated_at;

COMMIT;
