-- Create all schemas for Baalvion services
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS mining;
CREATE SCHEMA IF NOT EXISTS imperialpedia;
CREATE SCHEMA IF NOT EXISTS real_estate;
CREATE SCHEMA IF NOT EXISTS brand;
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS ir;
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS about;
CREATE SCHEMA IF NOT EXISTS cms;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS fulfillment;

-- Grant all privileges on all schemas to baalvion user
GRANT ALL PRIVILEGES ON SCHEMA auth TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA jobs TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA mining TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA imperialpedia TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA real_estate TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA brand TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA market TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA ir TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA dashboard TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA about TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA cms TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA commerce TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA orders TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA inventory TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA fulfillment TO baalvion;
GRANT ALL PRIVILEGES ON DATABASE baalvion_db TO baalvion;

-- Set search path
ALTER ROLE baalvion SET search_path TO public, auth, jobs, mining, imperialpedia, real_estate, brand, market, ir, dashboard, about, cms, commerce, orders, inventory, fulfillment;

-- ── 'postgres' role for the financial-services-java stack ─────────────────────
-- The financial services (ledger, payments, accounts, escrow, settlement,
-- reconciliation, audit, reporting, risk, …) run on this single shared database now
-- that their bundled postgres:16 has been removed. Their Flyway migrations do
-- `ALTER SCHEMA <svc> OWNER TO postgres`, but this DB's superuser is `baalvion` and
-- there is no `postgres` role by default. Create it (idempotent, NOLOGIN) so those
-- migrations succeed; `baalvion` (superuser) can reassign schema ownership to it and
-- still has full access at runtime. This runs only on a fresh volume — for an existing
-- baalvion-postgres volume, run the same statement once via docker exec (see RUN_LOCAL.md).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres;
  END IF;
END
$$;
