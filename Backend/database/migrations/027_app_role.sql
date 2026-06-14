-- 027_app_role.sql — non-superuser runtime role for RLS enforcement (R1).
--
-- RLS is silently IGNORED for superusers and (without FORCE) for table owners.
-- Services currently connect as the privileged owner role, so enabling RLS does
-- nothing until the runtime connection role is a NON-SUPERUSER, NOBYPASSRLS role.
-- This migration creates that role. It is a precondition for all of R1.
--
-- Run ONCE as a superuser/owner (NOT a per-service schema runner — CREATE ROLE is
-- cluster-global). Idempotent. Password is injected via a psql var, never committed:
--   psql "$ADMIN_DATABASE_URL" -v app_pw="$BAALVION_APP_PASSWORD" -f 027_app_role.sql
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    CREATE ROLE baalvion_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE baalvion_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

ALTER ROLE baalvion_app PASSWORD :'app_pw';

-- Least-privilege grants across the app schemas (extend per service rollout).
DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['trade','commerce','orders','oms','inventory','marketplace','market','public'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO baalvion_app', s);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO baalvion_app', s);
      EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO baalvion_app', s);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app', s);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO baalvion_app', s);
    END IF;
  END LOOP;
END $$;

COMMIT;
