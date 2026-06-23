-- ════════════════════════════════════════════════════════════════════════════
-- payments-bootstrap.sql — payment-service (JVM) Flyway prerequisites.
--
-- Run ONCE per database, BEFORE app-payments starts, as the RDS master (or any role
-- with rds_superuser / CREATEROLE). Idempotent & safe to re-run.
--
--   psql "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_MASTER_USER" \
--        -f deploy/consolidated/sql/payments-bootstrap.sql
--
-- Why (discovered in cold-start validation — see docs/.../07-risks-and-readiness.md R12):
--   V001  → ALTER SCHEMA payments OWNER TO postgres   (UNGUARDED → role 'postgres' MUST exist,
--                                                       else Flyway fails → JVM crash-loops)
--   V007  → FORCE ROW LEVEL SECURITY                  (tenant RLS enforced even for the owner)
--   V008..V011 → GRANT DML ... TO baalvion_app        (role-guarded; needs baalvion_app to EXIST
--                                                       before migration IF the app connects as the
--                                                       non-superuser runtime role — recommended)
-- ════════════════════════════════════════════════════════════════════════════

-- (1) Schema-owner role required by V001. Ownership only — no LOGIN, no SUPERUSER needed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres NOLOGIN;
    RAISE NOTICE 'created role postgres (payments schema owner)';
  END IF;
END$$;

-- (2) Let the Flyway connection role assign ownership to postgres (ALTER SCHEMA ... OWNER TO
--     requires the executor to be a member of the new owner role, or a superuser).
--     No-op when the connection is already postgres or a superuser (e.g. the dry-run's baalvion).
DO $$
BEGIN
  IF current_user <> 'postgres'
     AND NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper) THEN
    EXECUTE format('GRANT postgres TO %I', current_user);
    RAISE NOTICE 'granted postgres membership to %', current_user;
  END IF;
END$$;

-- (3) Non-superuser runtime role for least-privilege app connections. FORCE RLS enforces on it,
--     and V008..V011 grant it DML during migration. Set its password from Secrets Manager
--     (ALTER ROLE baalvion_app PASSWORD '<secret>'). Skip this block only if the app intentionally
--     connects as the owner/master (RLS still enforces via FORCE, but that is NOT least-privilege).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    CREATE ROLE baalvion_app LOGIN PASSWORD 'CHANGE_ME_FROM_SECRETS_MANAGER';
    RAISE NOTICE 'created role baalvion_app (runtime DML role) — set its password from Secrets Manager';
  END IF;
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO baalvion_app', current_database());
END$$;
