-- 041 — Logistics Core Foundation, Phase 1: address book.
--
--   • tradeops.logistics_addresses — general-purpose operational address book
--     (pickup/delivery/warehouse/port/airport/rail/billing), distinct from
--     tradeops.verified_addresses (KYC onboarding evidence, migration 021ish).
--   • tradeops.shipments gains pickup_address_id / delivery_address_id so a
--     shipment can point at a book entry instead of loose free-text fields.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.logistics_addresses (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    address_type        text          NOT NULL DEFAULT 'pickup',
    company_name        text,
    contact_name        text,
    contact_phone       text,
    line1               text          NOT NULL,
    line2               text,
    city                text          NOT NULL,
    state_province      text,
    postal_code         text,
    country_code        text          NOT NULL,
    latitude            numeric(9,6),
    longitude           numeric(9,6),
    timezone            text,
    validated_at        timestamptz,
    validation_source   text,
    metadata            jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version             integer       NOT NULL DEFAULT 1,
    created_by          text,
    updated_by          text,
    deleted_by          text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT chk_logistics_addresses_type CHECK (address_type IN ('pickup','delivery','warehouse','port','airport','rail_terminal','billing','company'))
);

CREATE INDEX IF NOT EXISTS idx_logistics_addresses_tenant  ON tradeops.logistics_addresses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_addresses_type    ON tradeops.logistics_addresses (address_type);
CREATE INDEX IF NOT EXISTS idx_logistics_addresses_country ON tradeops.logistics_addresses (country_code);

ALTER TABLE tradeops.logistics_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.logistics_addresses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.logistics_addresses;
CREATE POLICY tenant_isolation ON tradeops.logistics_addresses
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

ALTER TABLE tradeops.shipments ADD COLUMN IF NOT EXISTS pickup_address_id uuid;
ALTER TABLE tradeops.shipments ADD COLUMN IF NOT EXISTS delivery_address_id uuid;

-- ADD CONSTRAINT has no IF NOT EXISTS in Postgres; drop-then-add keeps this rerunnable.
ALTER TABLE tradeops.shipments DROP CONSTRAINT IF EXISTS fk_shipments_pickup_address;
ALTER TABLE tradeops.shipments
    ADD CONSTRAINT fk_shipments_pickup_address FOREIGN KEY (pickup_address_id) REFERENCES tradeops.logistics_addresses (id) ON DELETE SET NULL;
ALTER TABLE tradeops.shipments DROP CONSTRAINT IF EXISTS fk_shipments_delivery_address;
ALTER TABLE tradeops.shipments
    ADD CONSTRAINT fk_shipments_delivery_address FOREIGN KEY (delivery_address_id) REFERENCES tradeops.logistics_addresses (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_pickup_address   ON tradeops.shipments (pickup_address_id);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_address ON tradeops.shipments (delivery_address_id);
