-- Phase 2 Auction Engine: timed auctions with live (proxy) bidding, anti-snipe
-- extension, reserve-gated winner selection and settlement. `auctions` is the
-- mutable aggregate (optimistic lock); `auction_bids` are immutable facts whose
-- only mutable column is `status` (no-delete); `auction_events` is a fully
-- append-only forensic log. Every row is tenant-owned (organizationId NOT NULL)
-- and RLS-scoped.

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "AuctionType" AS ENUM ('ENGLISH', 'SEALED', 'DUTCH');
CREATE TYPE "AuctionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'SETTLED', 'FAILED', 'CANCELLED');
CREATE TYPE "AuctionBidStatus" AS ENUM ('ACCEPTED', 'WINNING', 'OUTBID', 'WON', 'LOST', 'REJECTED', 'RETRACTED');

-- ── auctions (mutable aggregate) ─────────────────────────────────────────────
CREATE TABLE "auctions" (
  "id"                 UUID NOT NULL,
  "organizationId"     UUID NOT NULL,
  "reference"          TEXT,
  "type"               "AuctionType" NOT NULL DEFAULT 'ENGLISH',
  "status"             "AuctionStatus" NOT NULL DEFAULT 'DRAFT',
  "title"              TEXT NOT NULL,
  "lotRef"             TEXT,
  "tradeId"            UUID,
  "sellerOrgId"        UUID,
  "sellerRef"          TEXT,
  "currency"           TEXT NOT NULL DEFAULT 'USD',
  "startPrice"         DECIMAL(20,4) NOT NULL,
  "reservePrice"       DECIMAL(20,4),
  "bidIncrement"       DECIMAL(20,4) NOT NULL DEFAULT 1,
  "buyNowPrice"        DECIMAL(20,4),
  "currentPrice"       DECIMAL(20,4) NOT NULL DEFAULT 0,
  "currentBidId"       UUID,
  "leaderActorId"      TEXT,
  "leaderMaxProxy"     DECIMAL(20,4),
  "bidCount"           INTEGER NOT NULL DEFAULT 0,
  "startsAt"           TIMESTAMP(3) NOT NULL,
  "endsAt"             TIMESTAMP(3) NOT NULL,
  "originalEndsAt"     TIMESTAMP(3) NOT NULL,
  "antiSnipeSeconds"   INTEGER NOT NULL DEFAULT 0,
  "antiSnipeThreshold" INTEGER NOT NULL DEFAULT 0,
  "extensionCount"     INTEGER NOT NULL DEFAULT 0,
  "winnerBidId"        UUID,
  "winnerActorId"      TEXT,
  "winningAmount"      DECIMAL(20,4),
  "settlementId"       UUID,
  "settledAt"          TIMESTAMP(3),
  "closedReason"       TEXT,
  "metadata"           JSONB,
  "version"            INTEGER NOT NULL DEFAULT 1,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  "deletedAt"          TIMESTAMP(3),
  CONSTRAINT "auctions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auctions_prices_nonneg" CHECK (
    "startPrice" >= 0 AND "currentPrice" >= 0 AND "bidIncrement" > 0
    AND ("reservePrice" IS NULL OR "reservePrice" >= 0)
    AND ("buyNowPrice" IS NULL OR "buyNowPrice" >= 0)
    AND ("winningAmount" IS NULL OR "winningAmount" >= 0)
  ),
  CONSTRAINT "auctions_window_valid" CHECK ("endsAt" > "startsAt"),
  CONSTRAINT "auctions_antisnipe_nonneg" CHECK ("antiSnipeSeconds" >= 0 AND "antiSnipeThreshold" >= 0)
);
CREATE INDEX "auctions_organizationId_idx" ON "auctions"("organizationId");
CREATE INDEX "auctions_status_idx" ON "auctions"("status");
CREATE INDEX "auctions_endsAt_idx" ON "auctions"("endsAt");
CREATE INDEX "auctions_tradeId_idx" ON "auctions"("tradeId");
CREATE INDEX "auctions_deletedAt_idx" ON "auctions"("deletedAt");
CREATE UNIQUE INDEX "auctions_org_reference_uq"
  ON "auctions"("organizationId", "reference") WHERE "reference" IS NOT NULL AND "deletedAt" IS NULL;

-- ── auction_bids (immutable facts; only status flips) ────────────────────────
CREATE TABLE "auction_bids" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "auctionId"      UUID NOT NULL,
  "bidderActorId"  TEXT NOT NULL,
  "bidderOrgId"    UUID,
  "amount"         DECIMAL(20,4) NOT NULL,
  "maxProxyAmount" DECIMAL(20,4),
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "status"         "AuctionBidStatus" NOT NULL DEFAULT 'ACCEPTED',
  "isAutoBid"      BOOLEAN NOT NULL DEFAULT false,
  "sequence"       INTEGER NOT NULL,
  "reference"      TEXT,
  "placedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata"       JSONB,
  CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auction_bids_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "auction_bids_proxy_gte_amount" CHECK ("maxProxyAmount" IS NULL OR "maxProxyAmount" >= "amount")
);
CREATE INDEX "auction_bids_organizationId_idx" ON "auction_bids"("organizationId");
CREATE INDEX "auction_bids_auctionId_amount_idx" ON "auction_bids"("auctionId", "amount");
CREATE INDEX "auction_bids_auctionId_sequence_idx" ON "auction_bids"("auctionId", "sequence");
CREATE INDEX "auction_bids_bidderActorId_idx" ON "auction_bids"("bidderActorId");
CREATE INDEX "auction_bids_status_idx" ON "auction_bids"("status");
-- One bid per (org, auction, reference): idempotent submission.
CREATE UNIQUE INDEX "auction_bids_auction_reference_uq"
  ON "auction_bids"("auctionId", "reference") WHERE "reference" IS NOT NULL;

-- ── auction_events (append-only forensic log) ────────────────────────────────
CREATE TABLE "auction_events" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "auctionId"      UUID NOT NULL,
  "sequence"       INTEGER NOT NULL,
  "type"           TEXT NOT NULL,
  "actorId"        TEXT NOT NULL,
  "actorRole"      TEXT,
  "bidId"          UUID,
  "amount"         DECIMAL(20,4),
  "currency"       TEXT,
  "priceBefore"    DECIMAL(20,4),
  "priceAfter"     DECIMAL(20,4),
  "data"           JSONB,
  "correlationId"  TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auction_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auction_events_auction_sequence_uq" ON "auction_events"("auctionId", "sequence");
CREATE INDEX "auction_events_organizationId_idx" ON "auction_events"("organizationId");
CREATE INDEX "auction_events_type_idx" ON "auction_events"("type");
CREATE INDEX "auction_events_createdAt_idx" ON "auction_events"("createdAt");

-- ── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE "auction_bids"
  ADD CONSTRAINT "auction_bids_auctionId_fkey"
  FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auction_events"
  ADD CONSTRAINT "auction_events_auctionId_fkey"
  FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Least-privilege grants ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "auctions", "auction_bids", "auction_events"
  TO baalvion_app;

-- ── Row-Level Security: every row is strictly tenant-scoped ──────────────────
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['auctions', 'auction_bids', 'auction_events']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$
      CREATE POLICY tenant_read ON %I FOR SELECT USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_update ON %I FOR UPDATE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_delete ON %I FOR DELETE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
  END LOOP;
END
$rls$;

-- ── Immutability ─────────────────────────────────────────────────────────────
-- auction_events are fully append-only (reuse enforce_append_only() from the
-- tenant-isolation migration).
CREATE TRIGGER auction_events_no_mutate
  BEFORE UPDATE OR DELETE ON "auction_events"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- auction_bids may flip status (ACCEPTED -> OUTBID/WON/LOST) but are never
-- deleted (reuse enforce_no_delete() from the settlement-ledger migration).
CREATE TRIGGER auction_bids_no_delete
  BEFORE DELETE ON "auction_bids"
  FOR EACH ROW EXECUTE FUNCTION enforce_no_delete();
