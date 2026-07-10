-- 050 — Freight Management: Carrier Performance + Booking↔Quote link (Phase 3, Prompt 2).
--
-- carrier_performance is GLOBAL reference data (no tenant_id, like carriers itself in
-- migration 047) — a carrier's on-time/damage/cancellation/ETA-accuracy track record
-- is a platform-wide fact, not a per-tenant view, and denormalizes into
-- carriers.performance_score. Populated periodically by the
-- freight_carrier_performance_refresh BullMQ job (queue/index.js), not computed
-- per-request.
--
-- Also links freight_bookings (migration 016) back to the new freight_quotes
-- (migration 049) it was created from, WITHOUT touching the existing
-- quotes/selected_quote JSONB snapshot fields (kept for backward compatibility with
-- the freight marketplace's in-memory comparison engine, which does not require a
-- persisted quote to book).

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIER PERFORMANCE (global reference data, periodic aggregate)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.carrier_performance (
    id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id             uuid          NOT NULL,
    period_start           timestamptz   NOT NULL,
    period_end             timestamptz   NOT NULL,
    bookings_count         integer       NOT NULL DEFAULT 0,
    on_time_pct            numeric(5,2),
    avg_transit_days       numeric(6,2),
    eta_accuracy_pct       numeric(5,2),
    damage_incident_rate   numeric(6,4),
    cancellation_rate      numeric(6,4),
    avg_rating             numeric(3,2),
    computed_score         numeric(5,2),
    created_at             timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_carrier_performance_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE CASCADE,
    CONSTRAINT uq_carrier_performance_period UNIQUE (carrier_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_carrier_performance_carrier ON tradeops.carrier_performance (carrier_id, period_end DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- FREIGHT BOOKINGS — link back to the persisted quote it was created from
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tradeops.freight_bookings ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE tradeops.freight_bookings
    ADD CONSTRAINT fk_freight_bookings_quote FOREIGN KEY (quote_id) REFERENCES tradeops.freight_quotes (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_freight_bookings_quote ON tradeops.freight_bookings (quote_id) WHERE quote_id IS NOT NULL;
