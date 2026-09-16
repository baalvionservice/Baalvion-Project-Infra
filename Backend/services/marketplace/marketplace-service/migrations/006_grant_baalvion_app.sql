-- Grant the non-superuser runtime role baalvion_app DML on the marketplace schema so RLS
-- actually enforces at runtime. Postgres checks table privileges BEFORE RLS, so without these
-- grants every query fails on permission instead of being filtered. RLS is ignored entirely for
-- superusers, so isolation only becomes real once the service connects as this role
-- (DB_USER=baalvion_app) — the policies in 002/004/005 are inert until then.
--
-- Run as the schema OWNER. Idempotent, and role-guarded so it is safe on a database where
-- baalvion_app has not been provisioned.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    RAISE NOTICE 'baalvion_app role absent — skipping grants for schema marketplace.';
    RETURN;
  END IF;
  EXECUTE 'GRANT USAGE ON SCHEMA marketplace TO baalvion_app';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA marketplace TO baalvion_app';
  EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA marketplace TO baalvion_app';
  EXECUTE 'GRANT EXECUTE ON FUNCTION marketplace.current_tenant() TO baalvion_app';
  EXECUTE 'GRANT EXECUTE ON FUNCTION marketplace.tenant_bypass() TO baalvion_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA marketplace GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA marketplace GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO baalvion_app';
END$$;
