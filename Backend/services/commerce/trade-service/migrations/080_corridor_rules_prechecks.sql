-- 080 — Corridor requirement matrix + pre-submit gate (Compression, Phase 2).
--
-- Two tables with deliberately different tenancy:
--
--   corridor_rules    GLOBAL reference data, NO tenant_id (like tradeops.hs_codes
--                     and tradeops.compliance_rules). What the EU requires on an
--                     import declaration is a jurisdictional fact, not a customer's
--                     private data. Rows here EXTEND the built-in ruleset in
--                     service/corridor/matrix.js, so a corridor can be taught a
--                     new requirement without a deploy.
--
--   filing_prechecks  TENANT-SCOPED, RLS. Every gate evaluation, kept so that
--                     FIRST-PASS ACCEPTANCE can be measured rather than asserted.
--                     gateway_outcome is backfilled from the customs submission,
--                     which is what turns the predicted probability into a
--                     reconciled number — an unreconciled estimate drifts into
--                     fiction, and this KPI is the one that decides whether the
--                     rejection loop is actually gone.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.corridor_rules (
    id                 text          PRIMARY KEY,
    scope              text          NOT NULL DEFAULT 'both',
    active             boolean       NOT NULL DEFAULT true,
    priority           integer       NOT NULL DEFAULT 100,
    when_clause        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    requires           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    severity           text          NOT NULL DEFAULT 'blocking',
    reason             text,
    adds_floor_hours   numeric(10,2) NOT NULL DEFAULT 0,
    source             text,
    effective_from     date,
    effective_to       date,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_corridor_rules_scope CHECK (scope IN ('import','export','both')),
    CONSTRAINT chk_corridor_rules_severity CHECK (severity IN ('blocking','warning'))
);

CREATE INDEX IF NOT EXISTS idx_corridor_rules_active ON tradeops.corridor_rules (active, priority);

-- ─────────────────────────────────────────────────────────────────────────────
-- FILING PRECHECKS (tenant-scoped, RLS) — the first-pass-acceptance ledger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.filing_prechecks (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    consignment_id        uuid,
    shipment_id           uuid,
    submission_id         uuid,
    origin_country        text,
    destination_country   text,
    direction             text          NOT NULL DEFAULT 'export',
    submittable           boolean       NOT NULL DEFAULT false,
    blocking_count        integer       NOT NULL DEFAULT 0,
    warning_count         integer       NOT NULL DEFAULT 0,
    findings              jsonb         NOT NULL DEFAULT '[]'::jsonb,
    requirements          jsonb         NOT NULL DEFAULT '{}'::jsonb,
    predicted_first_pass  numeric(5,4),
    corridor_floor_hours  numeric(10,2) NOT NULL DEFAULT 0,
    gateway_outcome       text,
    gateway_reason        text,
    reconciled_at         timestamptz,
    precheck_version      text,
    matrix_version        text,
    created_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_filing_prechecks_consignment FOREIGN KEY (consignment_id) REFERENCES tradeops.consignments (id) ON DELETE CASCADE,
    CONSTRAINT chk_filing_prechecks_outcome CHECK (gateway_outcome IS NULL OR gateway_outcome IN ('accepted','rejected')),
    CONSTRAINT chk_filing_prechecks_direction CHECK (direction IN ('import','export'))
);

CREATE INDEX IF NOT EXISTS idx_filing_prechecks_tenant        ON tradeops.filing_prechecks (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_filing_prechecks_consignment   ON tradeops.filing_prechecks (consignment_id) WHERE consignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_filing_prechecks_corridor      ON tradeops.filing_prechecks (origin_country, destination_country);
CREATE INDEX IF NOT EXISTS idx_filing_prechecks_outcome       ON tradeops.filing_prechecks (tenant_id, gateway_outcome) WHERE gateway_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_filing_prechecks_created_brin  ON tradeops.filing_prechecks USING brin (created_at);

ALTER TABLE tradeops.filing_prechecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.filing_prechecks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.filing_prechecks;
CREATE POLICY tenant_isolation ON tradeops.filing_prechecks
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
