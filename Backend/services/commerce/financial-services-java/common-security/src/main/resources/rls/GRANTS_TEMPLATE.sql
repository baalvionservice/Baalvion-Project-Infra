-- =============================================================================
-- RLS RUNTIME ENFORCEMENT — GRANTS TEMPLATE (Tenant Isolation layer 3a)
-- See docs/TENANT_ISOLATION.md and common-security RlsTenantSession.java
-- =============================================================================
--
-- WHAT THIS IS
--   Postgres checks table privileges BEFORE it checks Row-Level-Security policies.
--   The runtime app role (`baalvion_app`) must therefore be granted USAGE on the
--   schema and SELECT/INSERT/UPDATE/DELETE on the tenant tables, or every query
--   fails on a permission error long before RLS even runs. These grants give it
--   exactly that — and nothing more (no DDL, no ownership, no superuser).
--
-- WHO RUNS WHAT (the user split that makes RLS real)
--   * Flyway / migrations run as the schema OWNER (a superuser, e.g. `postgres`).
--     Owners + superusers BYPASS RLS, which is what lets migrations create/alter
--     tables and back-fill data freely.
--   * The RUNTIME connects as the NON-SUPERUSER role `baalvion_app`. RLS applies
--     to it, so `RlsTenantSession` setting `app.current_tenant_id` per transaction
--     is what actually scopes its reads/writes to one tenant.
--   If the runtime keeps connecting as a superuser/owner, ALL of layer 1/2/3 is
--   inert. This template is the bridge that turns the policies on.
--
-- HOW TO USE
--   This is a TEMPLATE, not a runnable migration. Each service owns its own schema
--   name(s), so DO NOT guess them here. For every schema a service exposes, copy
--   this block into a Flyway migration in THAT service (e.g.
--   `risk-service/.../db/migration/V0xx__grant_baalvion_app.sql`) and replace the
--   `<schema>` placeholder. Run it as the OWNER (the normal Flyway user), AFTER the
--   tables exist and AFTER `ENABLE`/`FORCE ROW LEVEL SECURITY`.
--
--   The `baalvion_app` LOGIN ROLE itself (with a password) is provisioned once at
--   the cluster level outside these per-schema migrations (it is the same role the
--   Node tenancy rollout established). These grants only wire that existing role to
--   this schema.
-- =============================================================================

-- 0) (Optional, cluster-level — typically already done; shown for completeness.)
--    Create the runtime role once per cluster. NOT a superuser, NO BYPASSRLS.
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
--     CREATE ROLE baalvion_app LOGIN PASSWORD :'baalvion_app_password'
--       NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
--   END IF;
-- END$$;

-- 1) Let the runtime role enter the schema.
GRANT USAGE ON SCHEMA <schema> TO baalvion_app;

-- 2) DML on every EXISTING tenant table in the schema. (RLS still constrains rows;
--    these grants only get the role past the table-privilege check.)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA <schema> TO baalvion_app;

-- 3) Sequences backing identity/serial columns, so INSERTs can obtain values.
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA <schema> TO baalvion_app;

-- 4) DEFAULT PRIVILEGES so tables/sequences created by FUTURE migrations are
--    automatically granted to baalvion_app without revisiting this file.
--    NOTE: default privileges apply to objects created by the role that RUNS this
--    statement (the schema owner). Run this as that owner.
ALTER DEFAULT PRIVILEGES IN SCHEMA <schema>
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA <schema>
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO baalvion_app;

-- 5) DELIBERATELY NOT GRANTED:
--    * No CREATE on the schema (no DDL at runtime).
--    * No ownership transfer.
--    * No BYPASSRLS / superuser — that would silently disable tenant isolation.
--    Keep `baalvion_app` minimal; RLS is only as strong as this role is unprivileged.
