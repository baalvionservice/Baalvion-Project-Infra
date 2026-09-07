-- Same defect ledger-service fixed in V003, still present here: V3 put a tenant-isolation policy
-- on the relay table.
--
--   USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
--
-- OutboxPublisher drains ALL tenants in one query (OutboxEventRepository: "SELECT * FROM
-- wallet.outbox_events WHERE status = :status ORDER BY created_at ASC LIMIT :limit FOR UPDATE
-- SKIP LOCKED") with no per-tenant GUC, and nothing in the suite issues set_config for it. Under
-- an RLS-enforced role that query does not fail closed the way V3's header claims — the
-- non-missing_ok form raises `unrecognized configuration parameter`, so the relay would never
-- drain and the outbox would stop guaranteeing the delivery it exists to guarantee.
--
-- Verified against production before writing this: the policy is present on wallet.outbox_events
-- and payments.outbox_events, and an unprivileged role selecting with the GUC unset errors rather
-- than returning zero rows. It is invisible today only because the runtime connects as a
-- superuser, which bypasses RLS entirely.
--
-- Resolution matches ledger V003 and the credit/aml/deal-room outbox tables, which never enabled
-- RLS on the relay table at all: isolate by the plain tenant_id column plus owner-only grants, and
-- keep the relay readable cross-tenant, which is its whole purpose. Idempotent.

DROP POLICY IF EXISTS outbox_events_tenant_isolation ON wallet.outbox_events;

ALTER TABLE wallet.outbox_events DISABLE ROW LEVEL SECURITY;

-- V3 also FORCEd it; clear that too so a later ENABLE does not resurrect owner-side enforcement.
ALTER TABLE wallet.outbox_events NO FORCE ROW LEVEL SECURITY;
