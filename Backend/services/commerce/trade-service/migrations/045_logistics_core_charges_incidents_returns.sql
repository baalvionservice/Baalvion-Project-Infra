-- 045 — Logistics Core Foundation, Phase 3: itemized cost ledger, incidents,
-- returns.
--
--   • tradeops.shipment_charges — line-item cost breakdown (freight/customs
--     duty/insurance premium/handling/...). Distinct from trade.freight_quotes
--     (a single carrier-quoted price pre-booking).
--   • tradeops.incidents — damage/loss/delay/theft/customs-hold/accident.
--   • tradeops.shipment_returns — RMA against a delivered shipment.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.shipment_charges (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id     uuid          NOT NULL,
    charge_type     text          NOT NULL,
    description     text,
    amount          numeric(20,2) NOT NULL,
    currency        text          NOT NULL DEFAULT 'USD',
    status          text          NOT NULL DEFAULT 'pending',
    reference_type  text,
    reference_id    text,
    approved_by     text,
    approved_at     timestamptz,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version         integer       NOT NULL DEFAULT 1,
    created_by      text,
    updated_by      text,
    deleted_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT fk_shipment_charges_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_shipment_charges_type CHECK (charge_type IN ('freight','customs_duty','insurance_premium','handling','documentation','demurrage','detention','other')),
    CONSTRAINT chk_shipment_charges_status CHECK (status IN ('pending','approved','invoiced','paid','disputed'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_charges_tenant   ON tradeops.shipment_charges (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_charges_shipment ON tradeops.shipment_charges (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_charges_status   ON tradeops.shipment_charges (status);

ALTER TABLE tradeops.shipment_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_charges FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_charges;
CREATE POLICY tenant_isolation ON tradeops.shipment_charges
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.incidents (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id        uuid          NOT NULL,
    container_id       uuid,
    incident_type      text          NOT NULL,
    severity           text          NOT NULL DEFAULT 'medium',
    status             text          NOT NULL DEFAULT 'open',
    description        text          NOT NULL,
    reported_by        text,
    reported_at        timestamptz   NOT NULL DEFAULT now(),
    resolved_at        timestamptz,
    resolution_notes   text,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version            integer       NOT NULL DEFAULT 1,
    created_by         text,
    updated_by         text,
    deleted_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT fk_incidents_shipment  FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT fk_incidents_container FOREIGN KEY (container_id) REFERENCES tradeops.containers (id) ON DELETE SET NULL,
    CONSTRAINT chk_incidents_type CHECK (incident_type IN ('damage','loss','delay','theft','customs_hold','accident','other')),
    CONSTRAINT chk_incidents_severity CHECK (severity IN ('low','medium','high','critical')),
    CONSTRAINT chk_incidents_status CHECK (status IN ('open','investigating','resolved','closed'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant   ON tradeops.incidents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_shipment ON tradeops.incidents (shipment_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status   ON tradeops.incidents (status);

ALTER TABLE tradeops.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.incidents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.incidents;
CREATE POLICY tenant_isolation ON tradeops.incidents
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.shipment_returns (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id     uuid          NOT NULL,
    rma_number      text,
    reason          text          NOT NULL,
    status          text          NOT NULL DEFAULT 'requested',
    quantity        integer       NOT NULL DEFAULT 1,
    requested_by    text,
    requested_at    timestamptz   NOT NULL DEFAULT now(),
    approved_at     timestamptz,
    received_at     timestamptz,
    refund_amount   numeric(20,2),
    notes           text,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version         integer       NOT NULL DEFAULT 1,
    created_by      text,
    updated_by      text,
    deleted_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT fk_shipment_returns_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_shipment_returns_reason CHECK (reason IN ('damaged','wrong_item','quality_issue','customer_request','other')),
    CONSTRAINT chk_shipment_returns_status CHECK (status IN ('requested','approved','in_transit','received','refunded','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_returns_tenant   ON tradeops.shipment_returns (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_shipment ON tradeops.shipment_returns (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_status   ON tradeops.shipment_returns (status);

ALTER TABLE tradeops.shipment_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_returns FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_returns;
CREATE POLICY tenant_isolation ON tradeops.shipment_returns
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
