-- ============================================================================
-- Shared-DB cutover: hand the `payments` schema from the (deleted) Node
-- payment-service to the canonical Java payment-service.
--
-- WHY: The removed Node payment-service created `payments.transactions`,
-- `payments.gateway_payments`, and `payments.payment_ledger_entries` directly
-- (no Flyway). The Java payment-service OWNS the `payments` schema via Flyway
-- (V001..V010) and, on first boot against this shared DB, V001 `CREATE TABLE
-- payments.transactions` and V009 `CREATE TABLE payments.gateway_payments`
-- COLLIDE with those orphaned Node tables (and their index/constraint names,
-- e.g. `gateway_payments_pkey`). Renaming the tables in place would still leave
-- the colliding PK/constraint names in the `payments` namespace, so we instead
-- ARCHIVE each whole table (with its indexes, constraints, and owned sequences)
-- into a separate `payments_legacy` schema via ALTER TABLE ... SET SCHEMA.
--
-- PROPERTIES:
--   * REVERSIBLE  — data is MOVED, never dropped. To undo before Java boots:
--                   ALTER TABLE payments_legacy.<t> SET SCHEMA payments;
--   * IDEMPOTENT  — guarded so it is a no-op once Java has migrated, and a
--                   re-run never clobbers an existing archive.
--   * SELF-GUARDED— aborts the moment a Flyway history table is detected (i.e.
--                   the Java service already owns this DB).
--
-- RUN ONCE, as a DB superuser/owner (e.g. `baalvion`), BEFORE the first boot of
-- the Java payment-service against the shared DB. See README.md in this folder.
-- ============================================================================

DO $$
DECLARE
  r      record;
  moved  int := 0;
  left_in_place int := 0;
BEGIN
  -- Guard 1: if any Flyway payment history table exists, the Java service has
  -- already migrated here — moving its tables now would corrupt it. Abort.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'flyway_history_payment'
  ) THEN
    RAISE NOTICE 'flyway_history_payment present — the Java payment-service already owns this DB. Cutover skipped (no-op).';
    RETURN;
  END IF;

  -- V001 runs `ALTER SCHEMA payments OWNER TO postgres`, so the role must exist.
  -- Fresh volumes get it from docker/init.sql; existing shared volumes may not.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres;  -- NOLOGIN by default; owns nothing until V001 runs
    RAISE NOTICE 'Created missing NOLOGIN role "postgres" (required by V001 ALTER SCHEMA payments OWNER TO postgres).';
  END IF;

  -- Nothing to archive if the schema was never created by the Node service.
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payments') THEN
    RAISE NOTICE 'No `payments` schema present — Java Flyway will create it fresh. Cutover not needed.';
    RETURN;
  END IF;

  CREATE SCHEMA IF NOT EXISTS payments_legacy;
  COMMENT ON SCHEMA payments_legacy IS
    'Archived pre-Java (Node payment-service) payments tables. Data preserved for audit/migration; safe to drop once the Java payment-service is verified.';

  -- Archive every base table currently in `payments` (none are Java-managed yet,
  -- since no Flyway history exists). Moving the whole table relocates its indexes,
  -- constraints, and owned sequences too, clearing the `payments` namespace for
  -- Java's CREATE TABLE statements (incl. clashing names like gateway_payments_pkey).
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'payments'
      AND table_type = 'BASE TABLE'
      AND table_name <> 'flyway_history_payment'
    ORDER BY table_name
  LOOP
    -- Re-run safety: never overwrite an existing archive of the same name.
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'payments_legacy' AND table_name = r.table_name
    ) THEN
      left_in_place := left_in_place + 1;
      RAISE NOTICE 'payments_legacy.% already exists — leaving payments.% in place for manual review.', r.table_name, r.table_name;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE payments.%I SET SCHEMA payments_legacy', r.table_name);
    moved := moved + 1;
    RAISE NOTICE 'Archived payments.% -> payments_legacy.% (rows preserved).', r.table_name, r.table_name;
  END LOOP;

  RAISE NOTICE 'Cutover complete: % archived, % left for review. Now boot the Java payment-service; Flyway V001..V010 will build the canonical `payments` schema. The `postgres` and `baalvion_app` roles must exist for ownership/grants (see README).', moved, left_in_place;
END $$;
