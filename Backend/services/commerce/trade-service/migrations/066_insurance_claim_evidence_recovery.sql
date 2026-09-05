-- 066 — Insurance: close the loop between "something happened to the cargo" and
-- "the policy pays out".
--
-- Until now trade.insurance_policies / trade.insurance_claims and
-- tradeops.incidents were unconnected islands: a shock alert or a total-loss
-- incident could be logged against a container with no path to a claim, and a
-- claim carried no evidence, ignored the policy deductible, and had nowhere to
-- record a recovery from the carrier. This migration adds:
--   • incidents → claims linkage (insurance_claims.incident_id) + the loss date,
--     so cover-period validation is possible at all.
--   • trade.insurance_claim_documents — the evidence file, keyed by the ROLE the
--     document plays in the claim (survey report, BL, photos, ...) and pointing
--     at the real document engine row (tradeops.documents) for storage/scanning/
--     versioning. Role vocabulary is claim-specific, storage is shared.
--   • deductible + subrogation columns — a marine claim settles NET of the
--     deductible, and the insurer then recovers from the carrier. Both were
--     unrepresentable.
--   • General Average (York-Antwerp): when a master jettisons or sacrifices
--     cargo to save the voyage, EVERY cargo interest contributes pro rata to the
--     loss, insured or not. That is the actual legal mechanism behind "the
--     container fell off the ship", and it is a separate money flow from the
--     policy claim.
--
-- RUNNER COMPATIBILITY: flat statements only (migrate.js splits on ';' at
-- end-of-line) — no DO-blocks, no CREATE TYPE.

-- ── insurance_claims: incident linkage, loss date, deductible, subrogation ────
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS incident_id uuid;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS container_id uuid;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS loss_date timestamptz;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS loss_type varchar(30);
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS gross_loss numeric(20,2);
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS deductible_applied numeric(20,2);
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS required_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS evidence_complete boolean NOT NULL DEFAULT false;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS subrogation_status varchar(20) NOT NULL DEFAULT 'none';
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS subrogation_recovered numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS subrogation_ref varchar(160);
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS general_average_id varchar(64);

-- Hard FKs are safe here: every column above is new, so there is no pre-existing
-- data of unknown shape to fail against (unlike insurance_claims.shipment_id,
-- which stays free text — see models/insurance_policies.js for why).
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_incident;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT fk_insurance_claims_incident FOREIGN KEY (incident_id) REFERENCES tradeops.incidents (id) ON DELETE SET NULL;

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_container;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT fk_insurance_claims_container FOREIGN KEY (container_id) REFERENCES tradeops.containers (id) ON DELETE SET NULL;

-- 'evidence_required' and 'withdrawn' join the lifecycle; the rest are the
-- statuses the controller already writes.
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_status;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT chk_insurance_claims_status CHECK (status IN ('filed','evidence_required','under_review','approved','rejected','paid','withdrawn'));

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_loss_type;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT chk_insurance_claims_loss_type CHECK (loss_type IS NULL OR loss_type IN ('total_loss','partial_loss','damage','theft','delay','general_average','non_delivery','contamination'));

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_subrogation;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT chk_insurance_claims_subrogation CHECK (subrogation_status IN ('none','pending','recovered','partially_recovered','waived','time_barred','failed'));

CREATE INDEX IF NOT EXISTS idx_insurance_claims_incident ON "trade".insurance_claims (incident_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_ga       ON "trade".insurance_claims (general_average_id);

-- ── insurance_policies: an expirable, voyage-scoped cover period ──────────────
-- Cargo cover is per-voyage (warehouse-to-warehouse with a 60-day discharge
-- clause), not a rolling 6-month term. expired_at records when the sweep aged
-- the policy out, so "active" stops meaning "forever".
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS expired_at timestamptz;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS coverage_basis varchar(30);
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS risk_assessment jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_insurance_policies_status;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT chk_insurance_policies_status CHECK (status IN ('pending','quoted','active','claimed','expired','cancelled'));

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_insurance_policies_basis;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT chk_insurance_policies_basis CHECK (coverage_basis IS NULL OR coverage_basis IN ('voyage','term','open_cover'));

CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiry ON "trade".insurance_policies (status, end_date);

-- ── claim evidence file ──────────────────────────────────────────────────────
-- doc_role is what the document PROVES in this claim; document_id is where the
-- bytes live (tradeops.documents, with its versioning/AV-scan/validation).
CREATE TABLE IF NOT EXISTS "trade".insurance_claim_documents (
    id           varchar(64)  PRIMARY KEY,
    tenant_id    text,
    claim_id     varchar(64)  NOT NULL,
    doc_role     text         NOT NULL,
    document_id  uuid,
    title        text,
    status       text         NOT NULL DEFAULT 'attached',
    note         text,
    uploaded_by  text,
    reviewed_by  text,
    reviewed_at  timestamptz,
    metadata     jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_icd_claim    FOREIGN KEY (claim_id)    REFERENCES "trade".insurance_claims (id) ON DELETE CASCADE,
    CONSTRAINT fk_icd_document FOREIGN KEY (document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT chk_icd_role   CHECK (doc_role IN ('bill_of_lading','commercial_invoice','packing_list','survey_report','photo_evidence','police_report','carrier_claim_letter','non_delivery_certificate','delivery_receipt','weather_report','repair_estimate','general_average_bond','insurance_certificate','other')),
    CONSTRAINT chk_icd_status CHECK (status IN ('attached','verified','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_icd_claim  ON "trade".insurance_claim_documents (claim_id);
CREATE INDEX IF NOT EXISTS idx_icd_tenant ON "trade".insurance_claim_documents (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_icd_claim_role ON "trade".insurance_claim_documents (claim_id, doc_role);

ALTER TABLE "trade".insurance_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade".insurance_claim_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "trade".insurance_claim_documents;
CREATE POLICY tenant_isolation ON "trade".insurance_claim_documents
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ── General Average (York-Antwerp Rules) ─────────────────────────────────────
-- The declaration is made by the shipowner for the whole voyage; the adjuster
-- then apportions the sacrifice + salvage expenses across every cargo interest
-- by contributory value. Cargo is not released until security is posted, which
-- is why status/security_type matter operationally, not just accounting-wise.
CREATE TABLE IF NOT EXISTS "trade".general_average_declarations (
    id                       varchar(64)  PRIMARY KEY,
    tenant_id                text,
    incident_id              uuid,
    vessel_name              text,
    voyage_no                text,
    declared_by              text,
    average_adjuster         text,
    declared_at              timestamptz,
    status                   text         NOT NULL DEFAULT 'declared',
    currency                 varchar(10)  NOT NULL DEFAULT 'USD',
    sacrifice_value          numeric(20,2) NOT NULL DEFAULT 0,
    salvage_expenses         numeric(20,2) NOT NULL DEFAULT 0,
    total_contributory_value numeric(20,2) NOT NULL DEFAULT 0,
    contribution_rate        numeric(12,8),
    adjustment_ref           text,
    notes                    text,
    metadata                 jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at               timestamptz  NOT NULL DEFAULT now(),
    updated_at               timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_ga_incident FOREIGN KEY (incident_id) REFERENCES tradeops.incidents (id) ON DELETE SET NULL,
    CONSTRAINT chk_ga_status  CHECK (status IN ('declared','adjusting','secured','settled','closed'))
);

CREATE INDEX IF NOT EXISTS idx_ga_tenant   ON "trade".general_average_declarations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ga_incident ON "trade".general_average_declarations (incident_id);

ALTER TABLE "trade".general_average_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade".general_average_declarations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "trade".general_average_declarations;
CREATE POLICY tenant_isolation ON "trade".general_average_declarations
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS "trade".general_average_contributions (
    id                  varchar(64)  PRIMARY KEY,
    tenant_id           text,
    ga_id               varchar(64)  NOT NULL,
    policy_id           varchar(64),
    shipment_id         text,
    container_id        uuid,
    cargo_owner         text,
    contributory_value  numeric(20,2) NOT NULL DEFAULT 0,
    contribution_amount numeric(20,2) NOT NULL DEFAULT 0,
    security_type       text         NOT NULL DEFAULT 'none',
    security_ref        text,
    status              text         NOT NULL DEFAULT 'pending',
    settled_at          timestamptz,
    payment_ref         text,
    metadata            jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_gac_ga        FOREIGN KEY (ga_id)     REFERENCES "trade".general_average_declarations (id) ON DELETE CASCADE,
    CONSTRAINT fk_gac_policy    FOREIGN KEY (policy_id) REFERENCES "trade".insurance_policies (id) ON DELETE SET NULL,
    CONSTRAINT chk_gac_security CHECK (security_type IN ('none','average_bond','average_guarantee','cash_deposit')),
    CONSTRAINT chk_gac_status   CHECK (status IN ('pending','secured','settled','waived'))
);

CREATE INDEX IF NOT EXISTS idx_gac_ga     ON "trade".general_average_contributions (ga_id);
CREATE INDEX IF NOT EXISTS idx_gac_policy ON "trade".general_average_contributions (policy_id);
CREATE INDEX IF NOT EXISTS idx_gac_tenant ON "trade".general_average_contributions (tenant_id);

ALTER TABLE "trade".general_average_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade".general_average_contributions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "trade".general_average_contributions;
CREATE POLICY tenant_isolation ON "trade".general_average_contributions
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_ga;
ALTER TABLE "trade".insurance_claims
    ADD CONSTRAINT fk_insurance_claims_ga FOREIGN KEY (general_average_id) REFERENCES "trade".general_average_declarations (id) ON DELETE SET NULL;
