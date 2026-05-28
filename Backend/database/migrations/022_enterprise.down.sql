-- 022_enterprise.down.sql — rollback

BEGIN;

DROP TABLE IF EXISTS public.audit_export_destinations;
DROP TABLE IF EXISTS public.cost_centers;
DROP TABLE IF EXISTS public.oauth_apps;
DROP TABLE IF EXISTS public.white_label_configs;
DROP TABLE IF EXISTS public.sla_periods;
DROP TABLE IF EXISTS public.sla_definitions;
DROP TABLE IF EXISTS public.org_policies;
DROP TABLE IF EXISTS public.org_unit_members;
DROP TABLE IF EXISTS public.org_units;
DROP TABLE IF EXISTS public.custom_role_permissions;
DROP TABLE IF EXISTS public.custom_roles;
DROP TABLE IF EXISTS public.scim_provisioning_logs;
DROP TABLE IF EXISTS public.scim_tokens;
DROP TABLE IF EXISTS public.sso_connections;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS scim_external_id,
  DROP COLUMN IF EXISTS provisioned_via,
  DROP COLUMN IF EXISTS active,
  DROP COLUMN IF EXISTS custom_role_id;

ALTER TABLE public.api_keys
  DROP COLUMN IF EXISTS cost_center_id,
  DROP COLUMN IF EXISTS org_unit_id;

ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS tier,
  DROP COLUMN IF EXISTS enforce_sso,
  DROP COLUMN IF EXISTS enforce_mfa;

COMMIT;
