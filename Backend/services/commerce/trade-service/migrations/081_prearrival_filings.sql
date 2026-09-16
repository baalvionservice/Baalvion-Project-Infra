-- 081 — Pre-arrival filing scheduler (Clearance Compression, Phase 4).
--
-- The largest single lever in the programme. A clearance process that STARTS
-- when the vessel docks costs 3–6 days that filing ahead of arrival removes
-- entirely: the authority has already decided, so arrival becomes a release
-- event rather than the beginning of a queue.
--
-- One row per (consignment, filing requirement). A jurisdiction typically wants
-- a security/manifest filing on one clock and the fiscal declaration on another,
-- and those are genuinely different deadlines — collapsing them into a single
-- row is how the security filing gets missed.
--
-- anchor + anchor_at record WHICH event the deadline runs from. This is not
-- decoration: a US ISF is due 24h before LADING at the origin port, a deadline
-- that has already passed by the time the box is at sea. Scheduling everything
-- off ETA silently misses it, and the penalty is liquidated damages rather than
-- a delay.
--
-- target_at is the moment we intend to file: the START of the window, not the
-- deadline. Aiming at a deadline preserves the behaviour this phase removes.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.prearrival_filings (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    consignment_id      uuid          NOT NULL,
    shipment_id         uuid,
    destination_country text,
    regime_code         text,
    channel             text,
    filing_key          text          NOT NULL,
    label               text,
    anchor              text          NOT NULL DEFAULT 'arrival',
    anchor_at           timestamptz,
    earliest_at         timestamptz,
    due_at              timestamptz,
    target_at           timestamptz,
    status              text          NOT NULL DEFAULT 'scheduled',
    mandatory           boolean       NOT NULL DEFAULT true,
    submission_id       uuid,
    filed_at            timestamptz,
    attempts            integer       NOT NULL DEFAULT 0,
    last_error          text,
    penalty             text,
    regime_version      text,
    metadata            jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_prearrival_filings_consignment FOREIGN KEY (consignment_id) REFERENCES tradeops.consignments (id) ON DELETE CASCADE,
    CONSTRAINT chk_prearrival_filings_anchor CHECK (anchor IN ('lading','arrival')),
    CONSTRAINT chk_prearrival_filings_status CHECK (status IN ('scheduled','not_yet_open','open','due_soon','overdue','missed','filing','filed','failed','cancelled','not_applicable','unschedulable')),
    CONSTRAINT uq_prearrival_filings_key UNIQUE (tenant_id, consignment_id, filing_key)
);

CREATE INDEX IF NOT EXISTS idx_prearrival_filings_consignment ON tradeops.prearrival_filings (consignment_id);
CREATE INDEX IF NOT EXISTS idx_prearrival_filings_due         ON tradeops.prearrival_filings (status, target_at) WHERE status IN ('scheduled','open','due_soon','overdue');
CREATE INDEX IF NOT EXISTS idx_prearrival_filings_deadline    ON tradeops.prearrival_filings (tenant_id, due_at);
CREATE INDEX IF NOT EXISTS idx_prearrival_filings_missed      ON tradeops.prearrival_filings (tenant_id, status) WHERE status = 'missed';

ALTER TABLE tradeops.prearrival_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.prearrival_filings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.prearrival_filings;
CREATE POLICY tenant_isolation ON tradeops.prearrival_filings
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
