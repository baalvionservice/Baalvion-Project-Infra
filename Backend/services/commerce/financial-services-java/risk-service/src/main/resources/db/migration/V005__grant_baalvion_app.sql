-- Grant the non-superuser runtime role baalvion_app DML on the risk schema so
-- RLS (layers 1+2) actually enforces at runtime (layer 3a). Postgres checks table
-- privileges BEFORE RLS, so without these grants every query fails on permission.
-- Run as the schema OWNER (the normal Flyway user). Idempotent. Role-guarded so it
-- is safe on databases where baalvion_app has not been provisioned yet (027_app_role).
-- See common-security/.../rls/GRANTS_TEMPLATE.sql and docs/TENANT_ISOLATION.md.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    RAISE NOTICE 'baalvion_app role absent — skipping grants for schema risk; provision the role (027_app_role) and re-run.';
    RETURN;
  END IF;
  EXECUTE 'GRANT USAGE ON SCHEMA risk TO baalvion_app';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA risk TO baalvion_app';
  EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA risk TO baalvion_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA risk GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA risk GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO baalvion_app';
END$$;
