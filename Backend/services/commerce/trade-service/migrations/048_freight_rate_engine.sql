-- 048 — Freight Management: Rate Engine (Phase 3, Prompt 2).
--
-- Persisted, admin-editable pricing rules — the genuine gap the research pass
-- identified: today's freight pricing (service/freight/connectors/*'s hardcoded
-- RATE_CARD + lane-hash multiplier) has no configurable lane/weight/volume/seasonal/
-- contract/discount rule table. This migration adds one, plus a resolved/cached rate
-- line table the rate-preview + quote flows read from.
--
-- Two tables in schema `tradeops`, both TENANT-SCOPED + RLS (a tenant's negotiated
-- contract/discount rates are private, mirroring freight_bookings' pattern):
--   • freight_rate_rules — the rule definitions (lane/weight/volume/seasonal/peak/
--                         contract/country/discount/markup), stacked by `priority`.
--   • freight_rates      — resolved/cached rate lines produced by applying rules to
--                         a lane/carrier/weight combo.

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT RATE RULES (tenant-scoped, RLS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.freight_rate_rules (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    rule_type          text          NOT NULL,
    carrier_id         uuid,
    origin_code        text,
    destination_code   text,
    mode               text,
    min_weight_kg      numeric(20,3),
    max_weight_kg      numeric(20,3),
    min_volume_cbm     numeric(20,3),
    max_volume_cbm     numeric(20,3),
    valid_from         date,
    valid_to           date,
    currency           text          NOT NULL DEFAULT 'USD',
    adjustment_type    text          NOT NULL,
    adjustment_value   numeric(20,4) NOT NULL,
    priority           integer       NOT NULL DEFAULT 100,
    active             boolean       NOT NULL DEFAULT true,
    created_by         text,
    updated_by         text,
    deleted_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT fk_freight_rate_rules_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL,
    CONSTRAINT chk_freight_rate_rules_type CHECK (rule_type IN ('lane','weight','volume','seasonal','peak','contract','country','discount','markup')),
    CONSTRAINT chk_freight_rate_rules_adj_type CHECK (adjustment_type IN ('flat','percent','per_kg','per_cbm'))
);

CREATE INDEX IF NOT EXISTS idx_freight_rate_rules_tenant   ON tradeops.freight_rate_rules (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_freight_rate_rules_lane     ON tradeops.freight_rate_rules (origin_code, destination_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_freight_rate_rules_carrier  ON tradeops.freight_rate_rules (carrier_id) WHERE carrier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_rate_rules_active   ON tradeops.freight_rate_rules (active, priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_freight_rate_rules_validity ON tradeops.freight_rate_rules (valid_from, valid_to);

ALTER TABLE tradeops.freight_rate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.freight_rate_rules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.freight_rate_rules;
CREATE POLICY tenant_isolation ON tradeops.freight_rate_rules
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT RATES (tenant-scoped, RLS) — resolved/cached rate lines
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.freight_rates (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         text          NOT NULL DEFAULT 'T-DEMO',
    carrier_id        uuid,
    origin_code       text,
    destination_code  text,
    mode              text,
    base_rate         numeric(20,2) NOT NULL,
    fuel_pct          numeric(6,4)  NOT NULL DEFAULT 0,
    computed_rate     numeric(20,2) NOT NULL,
    currency          text          NOT NULL DEFAULT 'USD',
    valid_until        timestamptz,
    source            text          NOT NULL DEFAULT 'rule_engine',
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_freight_rates_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL,
    CONSTRAINT chk_freight_rates_source CHECK (source IN ('rule_engine','connector_rate_card','manual'))
);

CREATE INDEX IF NOT EXISTS idx_freight_rates_tenant  ON tradeops.freight_rates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_freight_rates_lane     ON tradeops.freight_rates (origin_code, destination_code);
CREATE INDEX IF NOT EXISTS idx_freight_rates_carrier  ON tradeops.freight_rates (carrier_id) WHERE carrier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_rates_created_brin ON tradeops.freight_rates USING brin (created_at);

ALTER TABLE tradeops.freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.freight_rates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.freight_rates;
CREATE POLICY tenant_isolation ON tradeops.freight_rates
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
