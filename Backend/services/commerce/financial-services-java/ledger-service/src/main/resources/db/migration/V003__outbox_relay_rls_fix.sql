-- FIX (code/security review, Finding 1): the ledger_outbox RLS policy added in V002 blocks the
-- relay's cross-tenant drain.
--
-- Root cause: V002 declared a tenant-isolation policy
--   USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
-- but NO code in this suite ever issues `set_config('app.current_tenant_id', ...)` / `SET LOCAL`
-- (verified: zero `current_setting`/`set_config` call sites in any *.java across the suite).
-- LedgerOutboxRelay sweeps ALL tenants in one query (FOR UPDATE SKIP LOCKED, no per-tenant GUC).
-- Under an RLS-enforced (non-owner) role this either throws `unrecognized configuration parameter`
-- (the non-missing_ok form) or matches zero rows, so the outbox would NEVER drain — silently
-- re-introducing the exact ledger/downstream divergence the outbox was built to prevent.
--
-- Suite-consistent fix (approach "c" — owner-only relay table, NOT RLS-forced):
-- The newest outbox tables in this suite do NOT enable RLS on the relay table at all:
--   credit.outbox_events     (credit-service  V2__outbox_inbox.sql)
--   aml.outbox_events        (aml-service     V2__outbox_inbox.sql)
--   deal_room.outbox_events  (deal-room       V2__outbox_inbox.sql)
-- They isolate by the plain `tenant_id` column and rely on owner-only GRANTs + the application's
-- tenant-scoped writes. The authoritative tenant isolation in this suite is application-level
-- (TenantContext-resolved tenant_id baked into every query/insert); the RLS policies on
-- journal_entries / payments.outbox_events are declared as defense-in-depth but are inert at
-- runtime because the app connects as the table owner (V001: `ALTER SCHEMA ledger OWNER TO postgres`),
-- which bypasses RLS. ledger_outbox is an internal, relay-only table that is intentionally read
-- cross-tenant by the relay, so RLS on it is actively harmful, not protective.
--
-- Therefore: drop the V002 policy and disable RLS on ledger_outbox, bringing it in line with the
-- credit/aml/deal-room outbox tables. Idempotent (IF EXISTS) so it is safe to re-run.

DROP POLICY IF EXISTS ledger_outbox_tenant_isolation ON ledger.ledger_outbox;

ALTER TABLE ledger.ledger_outbox DISABLE ROW LEVEL SECURITY;
