-- Fail-closed tenant Row-Level Security for the deal_room schema.
--
-- Every tenant-scoped table below gets a policy that constrains all reads AND writes to
-- the tenant identified by the per-transaction GUC `app.current_tenant_id`. A query that
-- does not match the GUC sees ZERO rows (fail-closed), and an INSERT/UPDATE that would land
-- a row in another tenant is rejected by WITH CHECK.
--
-- FORCE ROW LEVEL SECURITY makes the policy apply even to the table OWNER, so the app role
-- cannot accidentally bypass isolation just because it owns the schema.
--
-- This migration is INERT until the application connects as a NON-SUPERUSER role (superusers
-- and BYPASSRLS roles ignore RLS) AND sets `app.current_tenant_id` at the start of every
-- transaction. Until both conditions hold, these policies have no effect.
-- See financial-services-java/docs/TENANT_ISOLATION.md.

-- deal_rooms — one negotiation per buyer/seller pair (tenant_id uuid).
ALTER TABLE deal_room.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room.deal_rooms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deal_rooms_tenant_isolation ON deal_room.deal_rooms;
CREATE POLICY deal_rooms_tenant_isolation ON deal_room.deal_rooms
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- counter_offers — negotiation rounds (carries own tenant_id uuid).
ALTER TABLE deal_room.counter_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room.counter_offers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS counter_offers_tenant_isolation ON deal_room.counter_offers;
CREATE POLICY counter_offers_tenant_isolation ON deal_room.counter_offers
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- term_sheets — generated on acceptance (carries own tenant_id uuid).
ALTER TABLE deal_room.term_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room.term_sheets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS term_sheets_tenant_isolation ON deal_room.term_sheets;
CREATE POLICY term_sheets_tenant_isolation ON deal_room.term_sheets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- deal_messages — the negotiation chat thread (carries own tenant_id uuid).
ALTER TABLE deal_room.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room.deal_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deal_messages_tenant_isolation ON deal_room.deal_messages;
CREATE POLICY deal_messages_tenant_isolation ON deal_room.deal_messages
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- outbox_events — transactional outbox (tenant_id uuid).
ALTER TABLE deal_room.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_events_tenant_isolation ON deal_room.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON deal_room.outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- SKIPPED: deal_room.processed_events — inbox dedup table has no tenant column (event_id only).
