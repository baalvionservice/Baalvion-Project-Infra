-- Runs ONCE, automatically, when the Postgres data directory is first initialised
-- (docker-entrypoint-initdb.d). Executes as the cluster superuser (POSTGRES_USER).
--
-- Why: payment-service's Flyway migration V001__create_transactions_table.sql does
--   `ALTER SCHEMA payments OWNER TO postgres;`
-- but this cluster's superuser is `baalvion`, not `postgres`. Without a `postgres`
-- role the migration fails and payment-service crash-loops on every fresh volume.
-- This creates the role up front (before any service connects) so the owner assignment
-- succeeds. The role exists only to hold ownership; nothing logs in as it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres SUPERUSER;
  END IF;
END
$$;
