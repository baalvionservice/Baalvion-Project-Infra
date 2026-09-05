-- 079 — Canonical Consignment + derived documents (Clearance Compression, Phase 1).
--
-- The single source of truth for a shipment's facts. Today the same ~40 fields
-- are re-keyed into ~25 documents by 6 parties; every retype is a fresh error
-- surface, and a mismatch between two documents is the most common reason a
-- filing is rejected — which costs a full human queue cycle, not a minute.
--
-- consignments.canonical holds the normalized record (service/consignment/schema.js).
-- source_hash is a sha256 over it. Every derived document stores the source_hash
-- it was generated from, so staleness is a comparison rather than a guess: if the
-- consignment moved, the derived paperwork is provably out of date BEFORE it
-- reaches a border.
--
-- Money lives in `canonical`/`totals` as decimal strings alongside integer minor
-- units; the app does all arithmetic in minor units (see schema.js) because float
-- drift of one cent between the invoice and the declaration is a rejection.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.consignments (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    reference           text,
    status              text          NOT NULL DEFAULT 'draft',
    direction           text          NOT NULL DEFAULT 'export',
    trade_operation_id  uuid,
    shipment_id         uuid,
    origin_country      text,
    destination_country text,
    incoterm            text,
    currency            text          NOT NULL DEFAULT 'USD',
    canonical           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    totals              jsonb         NOT NULL DEFAULT '{}'::jsonb,
    source_hash         text,
    schema_version      text,
    locked_at           timestamptz,
    created_by          text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_consignments_trade_operation FOREIGN KEY (trade_operation_id) REFERENCES tradeops.trade_operations (id) ON DELETE SET NULL,
    CONSTRAINT chk_consignments_status CHECK (status IN ('draft','active','locked','cancelled')),
    CONSTRAINT chk_consignments_direction CHECK (direction IN ('import','export')),
    CONSTRAINT uq_consignments_reference UNIQUE (tenant_id, reference)
);

CREATE INDEX IF NOT EXISTS idx_consignments_tenant_status ON tradeops.consignments (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_consignments_corridor      ON tradeops.consignments (origin_country, destination_country);
CREATE INDEX IF NOT EXISTS idx_consignments_operation     ON tradeops.consignments (trade_operation_id) WHERE trade_operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consignments_shipment      ON tradeops.consignments (shipment_id) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consignments_created_brin  ON tradeops.consignments USING brin (created_at);

ALTER TABLE tradeops.consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.consignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.consignments;
CREATE POLICY tenant_isolation ON tradeops.consignments
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- DERIVED DOCUMENTS — projections of the canonical record, never authored
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.consignment_documents (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    consignment_id  uuid          NOT NULL,
    doc_type        text          NOT NULL,
    payload         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    source_hash     text          NOT NULL,
    content_hash    text,
    deriver_version text,
    generated_at    timestamptz   NOT NULL DEFAULT now(),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_consignment_documents_consignment FOREIGN KEY (consignment_id) REFERENCES tradeops.consignments (id) ON DELETE CASCADE,
    CONSTRAINT chk_consignment_documents_type CHECK (doc_type IN ('commercial_invoice','packing_list','certificate_of_origin','shipping_instruction','customs_declaration')),
    CONSTRAINT uq_consignment_documents_type UNIQUE (tenant_id, consignment_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_consignment_documents_consignment ON tradeops.consignment_documents (consignment_id);
CREATE INDEX IF NOT EXISTS idx_consignment_documents_hash        ON tradeops.consignment_documents (source_hash);

ALTER TABLE tradeops.consignment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.consignment_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.consignment_documents;
CREATE POLICY tenant_isolation ON tradeops.consignment_documents
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
