-- 049 — Freight Management: Quotes + Comparison (Phase 3, Prompt 2).
--
-- Persists the OUTPUT of a freight quote request. Distinct from the legacy
-- `trade.freight_quotes` (schema `trade`, string PK, order-driven single-carrier
-- upsert used by the /shipping_quotes shim) — this is the new marketplace-facing
-- quote, covering any origin/destination/cargo request (not just an existing order)
-- with a full per-carrier charge breakdown (freight/fuel/terminal/handling/customs/
-- insurance/tax) and persisted comparison scoring across the dimensions the spec
-- calls for (price/transit/reliability/capacity/carbon/insurance/tracking quality/
-- pickup availability/delivery accuracy/cancellation policy).
--
-- Three tables in schema `tradeops`, all TENANT-SCOPED + RLS:
--   • freight_quotes       — the quote request envelope.
--   • freight_quote_items  — child: one row per candidate carrier's priced option.
--   • freight_comparisons  — child: one row per (quote, carrier) scoring snapshot.

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT QUOTES (tenant-scoped, RLS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.freight_quotes (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id           uuid,
    trade_operation_id    uuid,
    origin                jsonb         NOT NULL DEFAULT '{}'::jsonb,
    destination           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    cargo                 jsonb         NOT NULL DEFAULT '{}'::jsonb,
    incoterm              text,
    transport_mode        text,
    preferred_carrier_id  uuid,
    requested_pickup      date,
    requested_delivery    date,
    status                text          NOT NULL DEFAULT 'draft',
    valid_until           timestamptz,
    engine_version        text,
    created_by            text,
    updated_by            text,
    deleted_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),
    deleted_at            timestamptz,
    CONSTRAINT fk_freight_quotes_operation FOREIGN KEY (trade_operation_id) REFERENCES tradeops.trade_operations (id) ON DELETE SET NULL,
    CONSTRAINT fk_freight_quotes_preferred_carrier FOREIGN KEY (preferred_carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL,
    CONSTRAINT chk_freight_quotes_status CHECK (status IN ('draft','quoted','expired','converted'))
);

CREATE INDEX IF NOT EXISTS idx_freight_quotes_tenant_status ON tradeops.freight_quotes (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_freight_quotes_shipment       ON tradeops.freight_quotes (shipment_id) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_quotes_operation       ON tradeops.freight_quotes (trade_operation_id) WHERE trade_operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_quotes_created_brin   ON tradeops.freight_quotes USING brin (created_at);

ALTER TABLE tradeops.freight_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.freight_quotes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.freight_quotes;
CREATE POLICY tenant_isolation ON tradeops.freight_quotes
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT QUOTE ITEMS (tenant-scoped, RLS) — one per candidate carrier option
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.freight_quote_items (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    quote_id            uuid          NOT NULL,
    carrier_id          uuid,
    service_level       text,
    base_freight        numeric(20,2) NOT NULL DEFAULT 0,
    fuel_surcharge      numeric(20,2) NOT NULL DEFAULT 0,
    terminal_charge     numeric(20,2) NOT NULL DEFAULT 0,
    handling_charge     numeric(20,2) NOT NULL DEFAULT 0,
    customs_charge      numeric(20,2) NOT NULL DEFAULT 0,
    insurance_estimate  numeric(20,2) NOT NULL DEFAULT 0,
    tax_estimate        numeric(20,2) NOT NULL DEFAULT 0,
    total_amount        numeric(20,2) NOT NULL DEFAULT 0,
    currency            text          NOT NULL DEFAULT 'USD',
    transit_days        integer,
    carbon_estimate_kg  numeric(20,2),
    rank_cheapest       integer,
    rank_fastest        integer,
    rank_best           integer,
    selected            boolean       NOT NULL DEFAULT false,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_freight_quote_items_quote FOREIGN KEY (quote_id) REFERENCES tradeops.freight_quotes (id) ON DELETE CASCADE,
    CONSTRAINT fk_freight_quote_items_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_freight_quote_items_quote   ON tradeops.freight_quote_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_freight_quote_items_tenant  ON tradeops.freight_quote_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_freight_quote_items_carrier ON tradeops.freight_quote_items (carrier_id) WHERE carrier_id IS NOT NULL;

ALTER TABLE tradeops.freight_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.freight_quote_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.freight_quote_items;
CREATE POLICY tenant_isolation ON tradeops.freight_quote_items
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT COMPARISONS (tenant-scoped, RLS) — one per (quote, carrier) scoring run
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.freight_comparisons (
    id                         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                  text          NOT NULL DEFAULT 'T-DEMO',
    quote_id                   uuid          NOT NULL,
    carrier_id                 uuid,
    price_score                numeric(6,4),
    transit_score               numeric(6,4),
    reliability_score           numeric(6,4),
    capacity_score              numeric(6,4),
    carbon_score                numeric(6,4),
    insurance_score             numeric(6,4),
    tracking_quality_score      numeric(6,4),
    pickup_availability_score   numeric(6,4),
    delivery_accuracy_score     numeric(6,4),
    cancellation_policy_score   numeric(6,4),
    overall_score               numeric(6,4),
    rank                        integer,
    created_at                 timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_freight_comparisons_quote FOREIGN KEY (quote_id) REFERENCES tradeops.freight_quotes (id) ON DELETE CASCADE,
    CONSTRAINT fk_freight_comparisons_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_freight_comparisons_quote  ON tradeops.freight_comparisons (quote_id, rank);
CREATE INDEX IF NOT EXISTS idx_freight_comparisons_tenant ON tradeops.freight_comparisons (tenant_id);

ALTER TABLE tradeops.freight_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.freight_comparisons FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.freight_comparisons;
CREATE POLICY tenant_isolation ON tradeops.freight_comparisons
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
