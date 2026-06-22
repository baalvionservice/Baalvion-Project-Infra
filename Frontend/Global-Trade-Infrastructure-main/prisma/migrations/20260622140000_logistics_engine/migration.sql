-- Phase 2 Logistics Engine: warehouses, carriers, freight quotes, container
-- management, shipments and an append-only tracking timeline. All rows are
-- tenant-owned (organizationId NOT NULL) and RLS-scoped. shipment_tracking_events
-- is fully append-only; the rest are optimistic-locked, soft-deleted aggregates.

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "FreightMode" AS ENUM ('SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL');
CREATE TYPE "WarehouseType" AS ENUM ('GENERAL', 'DISTRIBUTION', 'BONDED', 'COLD_STORAGE', 'FULFILLMENT', 'CROSS_DOCK');
CREATE TYPE "FreightQuoteStatus" AS ENUM ('DRAFT', 'QUOTED', 'ACCEPTED', 'EXPIRED', 'REJECTED');
CREATE TYPE "LogisticsShipmentStatus" AS ENUM ('CREATED', 'BOOKED', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS_HOLD', 'DELIVERED', 'EXCEPTION', 'CANCELLED');
CREATE TYPE "ContainerStatus" AS ENUM ('EMPTY', 'ALLOCATED', 'LOADING', 'LOADED', 'IN_TRANSIT', 'DISCHARGED', 'RETURNED');

-- ── warehouses ───────────────────────────────────────────────────────────────
CREATE TABLE "warehouses" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "code"           TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "type"           "WarehouseType" NOT NULL DEFAULT 'GENERAL',
  "addressLine"    TEXT,
  "city"           TEXT,
  "country"        TEXT,
  "lat"            DECIMAL(9,6),
  "lng"            DECIMAL(9,6),
  "capacityUnits"  INTEGER,
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "warehouses_capacity_nonneg" CHECK ("capacityUnits" IS NULL OR "capacityUnits" >= 0)
);
CREATE INDEX "warehouses_organizationId_idx" ON "warehouses"("organizationId");
CREATE INDEX "warehouses_country_idx" ON "warehouses"("country");
CREATE INDEX "warehouses_deletedAt_idx" ON "warehouses"("deletedAt");
CREATE UNIQUE INDEX "warehouses_org_code_uq" ON "warehouses"("organizationId", "code") WHERE "deletedAt" IS NULL;

-- ── carriers ─────────────────────────────────────────────────────────────────
CREATE TABLE "carriers" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "code"           TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "mode"           "FreightMode" NOT NULL,
  "scac"           TEXT,
  "iataCode"       TEXT,
  "services"       JSONB,
  "rating"         DECIMAL(3,2),
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "carriers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "carriers_rating_bounds" CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 5))
);
CREATE INDEX "carriers_organizationId_idx" ON "carriers"("organizationId");
CREATE INDEX "carriers_mode_idx" ON "carriers"("mode");
CREATE INDEX "carriers_deletedAt_idx" ON "carriers"("deletedAt");
CREATE UNIQUE INDEX "carriers_org_code_uq" ON "carriers"("organizationId", "code") WHERE "deletedAt" IS NULL;

-- ── freight_quotes ───────────────────────────────────────────────────────────
CREATE TABLE "freight_quotes" (
  "id"                 UUID NOT NULL,
  "organizationId"     UUID NOT NULL,
  "reference"          TEXT,
  "carrierId"          UUID,
  "mode"               "FreightMode" NOT NULL,
  "originCountry"      TEXT,
  "originPort"         TEXT,
  "destinationCountry" TEXT,
  "destinationPort"    TEXT,
  "containerType"      TEXT,
  "weightKg"           DECIMAL(14,3),
  "volumeM3"           DECIMAL(14,3),
  "chargeableWeightKg" DECIMAL(14,3),
  "currency"           TEXT NOT NULL DEFAULT 'USD',
  "baseAmount"         DECIMAL(20,4) NOT NULL,
  "surchargeAmount"    DECIMAL(20,4) NOT NULL DEFAULT 0,
  "totalAmount"        DECIMAL(20,4) NOT NULL,
  "transitDays"        INTEGER,
  "status"             "FreightQuoteStatus" NOT NULL DEFAULT 'QUOTED',
  "validUntil"         TIMESTAMP(3),
  "acceptedShipmentId" UUID,
  "metadata"           JSONB,
  "version"            INTEGER NOT NULL DEFAULT 1,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  "deletedAt"          TIMESTAMP(3),
  CONSTRAINT "freight_quotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "freight_quotes_amounts_nonneg" CHECK ("baseAmount" >= 0 AND "surchargeAmount" >= 0 AND "totalAmount" >= 0)
);
CREATE INDEX "freight_quotes_organizationId_idx" ON "freight_quotes"("organizationId");
CREATE INDEX "freight_quotes_carrierId_idx" ON "freight_quotes"("carrierId");
CREATE INDEX "freight_quotes_status_idx" ON "freight_quotes"("status");
CREATE INDEX "freight_quotes_deletedAt_idx" ON "freight_quotes"("deletedAt");
CREATE UNIQUE INDEX "freight_quotes_org_reference_uq" ON "freight_quotes"("organizationId", "reference") WHERE "reference" IS NOT NULL AND "deletedAt" IS NULL;

-- ── logistics_shipments ──────────────────────────────────────────────────────
CREATE TABLE "logistics_shipments" (
  "id"                  UUID NOT NULL,
  "organizationId"      UUID NOT NULL,
  "reference"           TEXT,
  "tradeId"             UUID,
  "carrierId"           UUID,
  "freightQuoteId"      UUID,
  "mode"                "FreightMode" NOT NULL,
  "status"              "LogisticsShipmentStatus" NOT NULL DEFAULT 'CREATED',
  "trackingNumber"      TEXT,
  "originWarehouseId"   UUID,
  "destWarehouseId"     UUID,
  "originLocation"      TEXT,
  "destinationLocation" TEXT,
  "incoterm"            TEXT,
  "etd"                 TIMESTAMP(3),
  "eta"                 TIMESTAMP(3),
  "deliveredAt"         TIMESTAMP(3),
  "lastEventAt"         TIMESTAMP(3),
  "lastLocation"        TEXT,
  "metadata"            JSONB,
  "version"             INTEGER NOT NULL DEFAULT 1,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  "deletedAt"           TIMESTAMP(3),
  CONSTRAINT "logistics_shipments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_shipments_organizationId_idx" ON "logistics_shipments"("organizationId");
CREATE INDEX "logistics_shipments_status_idx" ON "logistics_shipments"("status");
CREATE INDEX "logistics_shipments_tradeId_idx" ON "logistics_shipments"("tradeId");
CREATE INDEX "logistics_shipments_carrierId_idx" ON "logistics_shipments"("carrierId");
CREATE INDEX "logistics_shipments_deletedAt_idx" ON "logistics_shipments"("deletedAt");
CREATE UNIQUE INDEX "logistics_shipments_org_reference_uq" ON "logistics_shipments"("organizationId", "reference") WHERE "reference" IS NOT NULL AND "deletedAt" IS NULL;

-- ── containers ───────────────────────────────────────────────────────────────
CREATE TABLE "containers" (
  "id"               UUID NOT NULL,
  "organizationId"   UUID NOT NULL,
  "containerNo"      TEXT NOT NULL,
  "type"             TEXT NOT NULL,
  "sealNo"           TEXT,
  "status"           "ContainerStatus" NOT NULL DEFAULT 'EMPTY',
  "shipmentId"       UUID,
  "warehouseId"      UUID,
  "grossWeightKg"    DECIMAL(14,3),
  "tareWeightKg"     DECIMAL(14,3),
  "cargoDescription" TEXT,
  "metadata"         JSONB,
  "version"          INTEGER NOT NULL DEFAULT 1,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "deletedAt"        TIMESTAMP(3),
  CONSTRAINT "containers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "containers_weights_nonneg" CHECK (
    ("grossWeightKg" IS NULL OR "grossWeightKg" >= 0) AND ("tareWeightKg" IS NULL OR "tareWeightKg" >= 0)
  )
);
CREATE INDEX "containers_organizationId_idx" ON "containers"("organizationId");
CREATE INDEX "containers_shipmentId_idx" ON "containers"("shipmentId");
CREATE INDEX "containers_warehouseId_idx" ON "containers"("warehouseId");
CREATE INDEX "containers_status_idx" ON "containers"("status");
CREATE INDEX "containers_deletedAt_idx" ON "containers"("deletedAt");
CREATE UNIQUE INDEX "containers_org_containerNo_uq" ON "containers"("organizationId", "containerNo") WHERE "deletedAt" IS NULL;

-- ── shipment_tracking_events (append-only) ───────────────────────────────────
CREATE TABLE "shipment_tracking_events" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "shipmentId"     UUID NOT NULL,
  "sequence"       INTEGER NOT NULL,
  "type"           TEXT NOT NULL,
  "status"         TEXT,
  "location"       TEXT,
  "description"    TEXT,
  "occurredAt"     TIMESTAMP(3) NOT NULL,
  "source"         TEXT NOT NULL DEFAULT 'system',
  "data"           JSONB,
  "correlationId"  TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_tracking_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shipment_tracking_events_shipment_sequence_uq" ON "shipment_tracking_events"("shipmentId", "sequence");
CREATE INDEX "shipment_tracking_events_organizationId_idx" ON "shipment_tracking_events"("organizationId");
CREATE INDEX "shipment_tracking_events_occurredAt_idx" ON "shipment_tracking_events"("occurredAt");

-- ── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE "containers"
  ADD CONSTRAINT "containers_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "containers"
  ADD CONSTRAINT "containers_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipment_tracking_events"
  ADD CONSTRAINT "shipment_tracking_events_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Least-privilege grants ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "warehouses", "carriers", "freight_quotes", "logistics_shipments", "containers", "shipment_tracking_events"
  TO baalvion_app;

-- ── Row-Level Security: every row is strictly tenant-scoped ──────────────────
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'warehouses', 'carriers', 'freight_quotes', 'logistics_shipments', 'containers', 'shipment_tracking_events'
  ]
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

-- ── Immutability: tracking events are append-only ────────────────────────────
CREATE TRIGGER shipment_tracking_events_no_mutate
  BEFORE UPDATE OR DELETE ON "shipment_tracking_events"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
