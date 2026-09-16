-- 078 — Clearance Stage Ledger (Clearance Compression, Phase 0).
--
-- Measure before optimizing. Nothing in this service previously recorded HOW LONG
-- a stage of an import/export cycle took or WHO it was waiting on, so the ~19-day
-- cycle could only be argued about, never attributed. This table is the clock.
--
-- One row per (subject, stage). `subject_type` keeps it usable before the
-- canonical consignment exists (migration 079) — a timing can hang off a
-- shipment or a trade operation today and off a consignment tomorrow.
--
-- Blocked time is tracked separately from elapsed time on purpose: a stage that
-- took 40h of which 38h was "waiting for the shipper to upload a packing list"
-- is a completely different problem from one that took 40h of continuous work,
-- and the fix for each is different. blocked_since is the open block window;
-- blocked_ms is the banked total from closed windows.
--
-- touch_count counts how many times a stage was (re)opened. > 1 means rework —
-- a rejection loop — which is the single most expensive pattern in the cycle.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS policies written
-- explicitly per table (mirrors 015).

CREATE TABLE IF NOT EXISTS tradeops.clearance_stage_timings (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    subject_type       text          NOT NULL DEFAULT 'consignment',
    subject_id         uuid          NOT NULL,
    consignment_id     uuid,
    trade_operation_id uuid,
    shipment_id        uuid,
    stage              text          NOT NULL,
    track              text,
    owner_party        text,
    status             text          NOT NULL DEFAULT 'pending',
    started_at         timestamptz,
    target_at          timestamptz,
    completed_at       timestamptz,
    blocked_since      timestamptz,
    blocked_ms         bigint        NOT NULL DEFAULT 0,
    elapsed_ms         bigint,
    waiting_on_party   text,
    blocked_by         text,
    touch_count        integer       NOT NULL DEFAULT 0,
    baseline_hours     numeric(10,2),
    target_hours       numeric(10,2),
    breached           boolean       NOT NULL DEFAULT false,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_clearance_stage_timings_status CHECK (status IN ('pending','active','blocked','done','skipped')),
    CONSTRAINT chk_clearance_stage_timings_subject CHECK (subject_type IN ('consignment','shipment','trade_operation')),
    CONSTRAINT uq_clearance_stage_timings_subject_stage UNIQUE (tenant_id, subject_type, subject_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_subject    ON tradeops.clearance_stage_timings (tenant_id, subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_stage      ON tradeops.clearance_stage_timings (tenant_id, stage, status);
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_open       ON tradeops.clearance_stage_timings (tenant_id, status) WHERE status IN ('active','blocked');
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_breached   ON tradeops.clearance_stage_timings (tenant_id, breached) WHERE breached = true;
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_waiting    ON tradeops.clearance_stage_timings (tenant_id, waiting_on_party) WHERE waiting_on_party IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_shipment   ON tradeops.clearance_stage_timings (shipment_id) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clearance_stage_timings_created_brin ON tradeops.clearance_stage_timings USING brin (created_at);

ALTER TABLE tradeops.clearance_stage_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.clearance_stage_timings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.clearance_stage_timings;
CREATE POLICY tenant_isolation ON tradeops.clearance_stage_timings
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
