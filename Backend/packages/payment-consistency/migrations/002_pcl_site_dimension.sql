-- Payment Consistency Layer — site and tenant dimensions.
--
-- pcl.payment_state answers "what state is this payment in". It could not answer "which
-- property took it" or "who within that property earned it", which is what a single
-- cross-estate admin panel has to show. Three columns close that gap:
--
--   site_id    — which Baalvion property (from @baalvion/sites; 'ctm', 'gti', 'community', …)
--   tenant_id  — who within it earned the money (an Amarisé store, a paid community, a firm)
--   rail       — how it was paid, which must be a rail that site is granted
--
-- Nullable on purpose. Backfilling live payment rows is a separate, auditable step, and a
-- NOT NULL here would break every legacy writer the moment this ships. The NOT NULL is added
-- in a later migration once the backfill is verified — see the rollout note at the bottom.
--
-- Idempotent (IF NOT EXISTS), so it is safe to re-run and safe alongside shadow mode.

ALTER TABLE pcl.payment_state ADD COLUMN IF NOT EXISTS site_id   varchar(64);
ALTER TABLE pcl.payment_state ADD COLUMN IF NOT EXISTS tenant_id varchar(190);
ALTER TABLE pcl.payment_state ADD COLUMN IF NOT EXISTS rail      varchar(24);

COMMENT ON COLUMN pcl.payment_state.site_id IS
  'Baalvion site id from @baalvion/sites. The property that took the money.';
COMMENT ON COLUMN pcl.payment_state.tenant_id IS
  'The earner within the site (store, community, firm). Null where the site itself is the earner.';
COMMENT ON COLUMN pcl.payment_state.rail IS
  'Payment rail used. Must be one the site is granted in @baalvion/sites.';

-- Reject a rail the platform does not know. Kept in lock-step with PAYMENT_RAILS in
-- @baalvion/sites — per-site permission is enforced in code, but an unknown value is
-- rejected here so no writer can invent one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pcl_payment_state_rail_chk'
  ) THEN
    ALTER TABLE pcl.payment_state ADD CONSTRAINT pcl_payment_state_rail_chk
      CHECK (rail IS NULL OR rail IN ('razorpay','payu','stripe','cashfree','bank_transfer','crypto'));
  END IF;
END $$;

-- ── Indexes for the cross-estate admin panel ────────────────────────────────────
-- "every payment on every site, newest first" and "one site's payments, newest first" are
-- the two queries that panel runs on every load; without these they are sequential scans
-- that get slower with each property launched.
CREATE INDEX IF NOT EXISTS pcl_payment_state_site_created_idx
  ON pcl.payment_state (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pcl_payment_state_site_state_created_idx
  ON pcl.payment_state (site_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS pcl_payment_state_tenant_created_idx
  ON pcl.payment_state (tenant_id, created_at DESC)
  WHERE tenant_id IS NOT NULL;
-- Estate-wide feed, unfiltered by site.
CREATE INDEX IF NOT EXISTS pcl_payment_state_created_idx
  ON pcl.payment_state (created_at DESC);

-- ── Outbox carries the same dimensions ──────────────────────────────────────────
-- A consumer building the read model must not have to join back to payment_state to learn
-- which site an event belongs to; the event is self-describing.
ALTER TABLE pcl.payment_outbox ADD COLUMN IF NOT EXISTS site_id varchar(64);
CREATE INDEX IF NOT EXISTS pcl_payment_outbox_site_idx ON pcl.payment_outbox (site_id);

-- ── Rollout ─────────────────────────────────────────────────────────────────────
-- 1. Ship this migration. Nothing breaks: every column is nullable.
-- 2. Point writers at recordPayment() from @baalvion/payment-consistency, which refuses to
--    build a record without a registered site and a permitted rail.
-- 3. Backfill site_id on historical rows from each writing service's own known property.
-- 4. Verify no NULL site_id remains on rows newer than the cutover, then a later migration
--    sets NOT NULL. Do not set NOT NULL before step 4 — a legacy writer would start failing
--    captures, which is worse than an unattributed row.
