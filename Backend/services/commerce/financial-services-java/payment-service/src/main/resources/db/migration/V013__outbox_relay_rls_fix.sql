-- Same defect ledger-service fixed in V003, still present here: V002 put a tenant-isolation policy
-- on the relay table and V007 additionally FORCEd it.
--
--   USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
--
-- OutboxRelay drains ALL tenants in one query (OutboxEventRepository: "SELECT * FROM
-- payments.outbox_events WHERE status = :status ORDER BY created_at ASC LIMIT :limit FOR UPDATE
-- SKIP LOCKED") with no per-tenant GUC, and nothing in the suite issues set_config for it. Under
-- an RLS-enforced role the non-missing_ok form raises `unrecognized configuration parameter`, so
-- the relay would never drain — the payment outbox would silently stop delivering.
--
-- Verified against production before writing this: an unprivileged role selecting with the GUC
-- unset errors rather than returning zero rows. It is invisible today only because the runtime
-- connects as a superuser, which bypasses RLS entirely.
--
-- Resolution matches ledger V003 and the credit/aml/deal-room outbox tables: isolate by the plain
-- tenant_id column plus owner-only grants, and keep the relay readable cross-tenant. Idempotent.
--
-- payments.transactions and payments.approval_requests keep their policies — those are tenant-
-- scoped business tables read through a request-scoped tenant, not cross-tenant relay tables.

DROP POLICY IF EXISTS outbox_events_tenant_isolation ON payments.outbox_events;

ALTER TABLE payments.outbox_events DISABLE ROW LEVEL SECURITY;

-- V007 also FORCEd it. DISABLE alone is enough to stop policies applying, but clear FORCE too so a
-- later ENABLE does not silently resurrect owner-side enforcement on the relay.
ALTER TABLE payments.outbox_events NO FORCE ROW LEVEL SECURITY;
