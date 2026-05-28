-- 020_orchestration.down.sql — rollback for 020_orchestration.sql

BEGIN;

DROP TABLE IF EXISTS public.routing_policies;
DROP TABLE IF EXISTS public.ip_intelligence;
DROP TABLE IF EXISTS public.provider_geo_capabilities;
DROP TABLE IF EXISTS public.provider_credentials;

ALTER TABLE public.providers
  DROP COLUMN IF EXISTS kind,
  DROP COLUMN IF EXISTS proxy_type,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS cost_per_gb,
  DROP COLUMN IF EXISTS weight,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS enabled;

COMMIT;
