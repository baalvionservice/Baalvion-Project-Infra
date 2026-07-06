-- 031 — Phase 2 Trust/Verification/Compliance Foundation: Factory & Warehouse
-- Verification.
--
-- tradeops.facilities — the richer profile beyond a bare address (production/
-- warehouse capacity, employee count, photos/videos, GPS, third-party inspection
-- status). Each facility points at a factory/warehouse-typed
-- tradeops.verified_addresses row (migration 030) for its location.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.facilities (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    org_id                integer       NOT NULL,
    facility_type         text          NOT NULL,
    address_id            uuid,
    production_capacity   text,
    warehouse_capacity    text,
    employee_count        integer,
    gps_latitude          numeric(9,6),
    gps_longitude         numeric(9,6),
    media                 jsonb         NOT NULL DEFAULT '[]'::jsonb,
    inspection_status     text          NOT NULL DEFAULT 'not_requested',
    status                text          NOT NULL DEFAULT 'submitted',
    reviewed_by           text,
    reviewed_at           timestamptz,
    rejection_reason      text,
    metadata              jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version               integer       NOT NULL DEFAULT 1,
    created_by            text,
    updated_by            text,
    deleted_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),
    deleted_at            timestamptz,
    CONSTRAINT fk_facilities_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_facilities_address FOREIGN KEY (address_id) REFERENCES tradeops.verified_addresses (id) ON DELETE SET NULL,
    CONSTRAINT chk_facilities_type CHECK (facility_type IN ('factory', 'warehouse')),
    CONSTRAINT chk_facilities_inspection_status CHECK (inspection_status IN ('not_requested', 'scheduled', 'passed', 'failed')),
    CONSTRAINT chk_facilities_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_facilities_org      ON tradeops.facilities (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_tenant    ON tradeops.facilities (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_type      ON tradeops.facilities (org_id, facility_type) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.facilities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.facilities;
CREATE POLICY tenant_isolation ON tradeops.facilities
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
