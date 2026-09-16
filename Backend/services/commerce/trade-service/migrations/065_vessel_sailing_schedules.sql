-- 065 — Vessel Sailing Schedules: the "which ship sails from which port on which day"
-- layer. Distinct from tradeops.shipment_routes (062), which is the leg-by-leg journey
-- of ONE customer shipment. A sailing schedule exists independently of any booking:
-- a vessel runs a voyage that calls at a sequence of ports on published dates, and
-- many shipments ride on it.
--
-- Three tables:
--   vessels            the physical ship (IMO is the permanent, globally-unique id)
--   voyages            one sailing of a vessel (voyage number + service/route)
--   voyage_port_calls  the schedule itself: ordered port stops with ETA/ETD + actuals
--
-- PROVENANCE: every row carries `data_source` so a schedule row can always be traced
-- back to where it came from (a carrier API, a manual entry, a bulk import). Nothing
-- here is seeded with invented sailings — the tables start empty and are filled from
-- a real source.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function bodies.

CREATE TABLE IF NOT EXISTS tradeops.vessels (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text NOT NULL DEFAULT 'T-DEMO',
    imo_number      text UNIQUE,
    mmsi            text,
    name            text NOT NULL,
    vessel_type     text NOT NULL DEFAULT 'container',
    flag_country    text,
    operator_name   text,
    carrier_code    text,
    capacity_teu    integer,
    deadweight_tons integer,
    service_speed_knots numeric(5,2),
    year_built      integer,
    data_source     text NOT NULL DEFAULT 'manual',
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    updated_by      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS chk_vessels_type;
ALTER TABLE tradeops.vessels ADD CONSTRAINT chk_vessels_type CHECK (vessel_type IN (
    'container', 'bulk_carrier', 'tanker', 'roro', 'general_cargo', 'reefer', 'lng_carrier', 'other'
));

CREATE INDEX IF NOT EXISTS idx_vessels_name ON tradeops.vessels (name);
CREATE INDEX IF NOT EXISTS idx_vessels_carrier ON tradeops.vessels (carrier_code);

CREATE TABLE IF NOT EXISTS tradeops.voyages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text NOT NULL DEFAULT 'T-DEMO',
    vessel_id       uuid NOT NULL REFERENCES tradeops.vessels(id) ON DELETE CASCADE,
    voyage_number   text NOT NULL,
    service_name    text,
    direction       text,
    status          text NOT NULL DEFAULT 'scheduled',
    origin_port_code      text,
    destination_port_code text,
    departure_date  timestamptz,
    arrival_date    timestamptz,
    data_source     text NOT NULL DEFAULT 'manual',
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    updated_by      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tradeops.voyages DROP CONSTRAINT IF EXISTS chk_voyages_status;
ALTER TABLE tradeops.voyages ADD CONSTRAINT chk_voyages_status CHECK (status IN (
    'scheduled', 'in_transit', 'completed', 'cancelled', 'delayed'
));

CREATE UNIQUE INDEX IF NOT EXISTS uq_voyages_vessel_number ON tradeops.voyages (vessel_id, voyage_number);
CREATE INDEX IF NOT EXISTS idx_voyages_departure ON tradeops.voyages (departure_date);
CREATE INDEX IF NOT EXISTS idx_voyages_status ON tradeops.voyages (status);

CREATE TABLE IF NOT EXISTS tradeops.voyage_port_calls (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text NOT NULL DEFAULT 'T-DEMO',
    voyage_id       uuid NOT NULL REFERENCES tradeops.voyages(id) ON DELETE CASCADE,
    sequence        integer NOT NULL DEFAULT 0,
    port_code       text NOT NULL,
    port_name       text,
    country_code    text,
    terminal        text,
    call_type       text NOT NULL DEFAULT 'both',
    eta             timestamptz,
    etd             timestamptz,
    actual_arrival  timestamptz,
    actual_departure timestamptz,
    status          text NOT NULL DEFAULT 'scheduled',
    cutoff_at       timestamptz,
    data_source     text NOT NULL DEFAULT 'manual',
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    updated_by      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tradeops.voyage_port_calls DROP CONSTRAINT IF EXISTS chk_port_calls_type;
ALTER TABLE tradeops.voyage_port_calls ADD CONSTRAINT chk_port_calls_type CHECK (call_type IN (
    'load', 'discharge', 'both', 'transit'
));

ALTER TABLE tradeops.voyage_port_calls DROP CONSTRAINT IF EXISTS chk_port_calls_status;
ALTER TABLE tradeops.voyage_port_calls ADD CONSTRAINT chk_port_calls_status CHECK (status IN (
    'scheduled', 'arrived', 'working', 'departed', 'skipped', 'cancelled'
));

CREATE UNIQUE INDEX IF NOT EXISTS uq_port_calls_voyage_sequence ON tradeops.voyage_port_calls (voyage_id, sequence);
CREATE INDEX IF NOT EXISTS idx_port_calls_port_eta ON tradeops.voyage_port_calls (port_code, eta);
CREATE INDEX IF NOT EXISTS idx_port_calls_etd ON tradeops.voyage_port_calls (etd);
CREATE INDEX IF NOT EXISTS idx_port_calls_status ON tradeops.voyage_port_calls (status);
