-- Baalvion MVP — run ONCE against the fresh RDS instance as the master user,
-- connected to the baalvion_db database, BEFORE starting any service.
--
--   psql "host=<rds-endpoint> dbname=baalvion_db user=<master> sslmode=require" -f init-roles.sql
--
-- Creates the two roles the platform expects:
--   baalvion       -> owner / migration role (DDL, schema creation, Flyway)
--   baalvion_app   -> non-superuser runtime role used by RLS policies
--                     (payment-service grants runtime DML to it; @baalvion/tenancy
--                      RLS bypass list references it). MUST exist before
--                      payment-service runs its Flyway migrations.

-- 1. Owner / migration role (skip if RDS master is already 'baalvion')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion') THEN
    CREATE ROLE baalvion LOGIN PASSWORD :'baalvion_pw';
  END IF;
END$$;

-- 2. Runtime RLS role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    CREATE ROLE baalvion_app LOGIN PASSWORD :'baalvion_app_pw';
  END IF;
END$$;

-- 3. Database ownership / connect
ALTER DATABASE baalvion_db OWNER TO baalvion;
GRANT CONNECT ON DATABASE baalvion_db TO baalvion, baalvion_app;

-- 4. baalvion_app must be able to use the schemas the services create.
--    Schemas are created by each service on boot; default privileges ensure the
--    app role can read/write tables created afterwards by the owner role.
ALTER DEFAULT PRIVILEGES FOR ROLE baalvion IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app;

-- For each per-service schema, grant usage up front so RLS-scoped DML works as
-- soon as the schema appears. (Schemas: auth, rbac, audit, cms, commerce,
-- inventory, orders, payments.) These run idempotently; re-run after first boot
-- if a schema did not yet exist here.
-- Per-iteration exception handling: a missing schema must NOT abort the whole loop,
-- so each GRANT runs in its own nested BEGIN/EXCEPTION block.
DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['auth','rbac','audit','cms','commerce','inventory','orders','payments'] LOOP
    BEGIN
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO baalvion_app', s);
    EXCEPTION WHEN invalid_schema_name THEN
      -- schema not created yet; the service will create it on boot. Re-run after first boot.
      NULL;
    END;
  END LOOP;
END$$;

-- Usage:
--   psql ... -v baalvion_pw='<owner-pw>' -v baalvion_app_pw='<app-pw>' -f init-roles.sql
