-- 047 — Freight Management: Carrier Directory (Phase 3, Prompt 2).
--
-- Replaces the hardcoded CARRIER_PROFILES object (service/freight/schema.js) and
-- per-connector RATE_CARD constants as the DYNAMIC source of truth for carrier
-- metadata. "Design database to support any carrier dynamically — do not hardcode
-- providers": a carrier row with no `connector_key` match falls back to the
-- generic/manual connector (service/freight/connectors/genericConnector.js) rather
-- than requiring bespoke code, so the marketplace can onboard Maersk, MSC, CMA CGM,
-- DB Schenker, Kuehne+Nagel, or any other carrier without a code change.
--
-- Three tables in schema `tradeops`:
--   • carriers          — GLOBAL reference data (no tenant_id, like hs_codes) — the
--                         shared carrier registry every tenant reads. Distinct from
--                         the legacy `trade.carriers` (schema `trade`, string PK,
--                         read-only shim kept live) and from
--                         service/freight/schema.js's CARRIER enum (dhl/fedex/ups/
--                         maersk — the 4 carriers with coded connectors).
--   • carrier_services  — GLOBAL, child of carriers: per (carrier, transport mode)
--                         service offering (e.g. ocean FCL, air express).
--   • carrier_regions   — GLOBAL, child of carriers: coverage (country / lane /
--                         port-pair) a carrier serves.
--
-- No RLS on this migration — matches hs_codes/hs_tariff_lines (shared reference
-- data every tenant reads identically; writes are permission-gated in the app layer
-- via FREIGHT_CARRIER_MANAGE, not tenant-isolated).

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIERS (global reference data)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.carriers (
    id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    text          NOT NULL,
    name                    text          NOT NULL,
    logo_url                text,
    country                 text,
    connector_key           text,
    credential_env_prefix   text,
    services                jsonb         NOT NULL DEFAULT '[]'::jsonb,
    coverage                jsonb         NOT NULL DEFAULT '{}'::jsonb,
    fleet                   jsonb         NOT NULL DEFAULT '{}'::jsonb,
    modes                   jsonb         NOT NULL DEFAULT '[]'::jsonb,
    rating                  numeric(3,2)  NOT NULL DEFAULT 4.5,
    reliability_score       integer       NOT NULL DEFAULT 90,
    insurance               jsonb         NOT NULL DEFAULT '{}'::jsonb,
    certifications          jsonb         NOT NULL DEFAULT '[]'::jsonb,
    tracking_api_supported  boolean       NOT NULL DEFAULT false,
    booking_api_supported   boolean       NOT NULL DEFAULT false,
    pricing_api_supported   boolean       NOT NULL DEFAULT false,
    availability_status     text          NOT NULL DEFAULT 'active',
    operating_regions       jsonb         NOT NULL DEFAULT '[]'::jsonb,
    support_contact         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    documents               jsonb         NOT NULL DEFAULT '[]'::jsonb,
    status                  text          NOT NULL DEFAULT 'active',
    performance_score       numeric(5,2),
    created_by              text,
    updated_by              text,
    deleted_by              text,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now(),
    deleted_at              timestamptz,
    CONSTRAINT uq_carriers_code UNIQUE (code),
    CONSTRAINT chk_carriers_reliability CHECK (reliability_score BETWEEN 0 AND 100),
    CONSTRAINT chk_carriers_availability CHECK (availability_status IN ('active','limited','inactive')),
    CONSTRAINT chk_carriers_status CHECK (status IN ('active','suspended','inactive'))
);

CREATE INDEX IF NOT EXISTS idx_carriers_status       ON tradeops.carriers (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carriers_connector_key ON tradeops.carriers (connector_key) WHERE connector_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carriers_modes_gin     ON tradeops.carriers USING gin (modes);
CREATE INDEX IF NOT EXISTS idx_carriers_coverage_gin  ON tradeops.carriers USING gin (coverage);

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIER SERVICES (global, child of carriers)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.carrier_services (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id        uuid          NOT NULL,
    service_type      text          NOT NULL,
    transport_mode    text          NOT NULL,
    transit_time_days integer,
    base_fee          numeric(20,2),
    rate_per_kg       numeric(20,4),
    active            boolean       NOT NULL DEFAULT true,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_carrier_services_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carrier_services_carrier ON tradeops.carrier_services (carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_services_mode     ON tradeops.carrier_services (transport_mode);

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIER REGIONS (global, child of carriers)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.carrier_regions (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id        uuid          NOT NULL,
    region_type       text          NOT NULL,
    origin_code       text,
    destination_code  text,
    active            boolean       NOT NULL DEFAULT true,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_carrier_regions_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE CASCADE,
    CONSTRAINT chk_carrier_regions_type CHECK (region_type IN ('country','lane','port_pair'))
);

CREATE INDEX IF NOT EXISTS idx_carrier_regions_carrier ON tradeops.carrier_regions (carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_regions_lane     ON tradeops.carrier_regions (origin_code, destination_code) WHERE origin_code IS NOT NULL;
