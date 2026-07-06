'use strict';

/**
 * Unified Analytics v2 — trust / compliance / cost-control layers.
 *
 * Event model upgrade (every metric must be verified, deduplicated, privacy-safe,
 * cost-aware and attributable):
 *   consent_state          JSONB  — GA-style consent mode per event
 *   fraud_score            NUMERIC — bot/fraud score (0..1); rollups exclude high scores
 *   attribution_id         TEXT   — links a conversion to its attributed touchpoint
 *   dedupe_key             TEXT   — idempotency key for replay/duplicate suppression
 *   event_schema_version   SMALLINT — forward-compatible schema evolution (default 2)
 *
 * Plus two v2 support tables:
 *   analytics.anomalies            — reconciliation/anomaly findings
 *   analytics.provider_sync_state  — per-(website,provider) watermark + cost/status
 */
module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;

        // ALTER the partitioned parent — new columns propagate to every partition.
        await sequelize.query(`
            ALTER TABLE analytics.events
                ADD COLUMN IF NOT EXISTS consent_state jsonb NOT NULL DEFAULT '{}'::jsonb,
                ADD COLUMN IF NOT EXISTS fraud_score numeric,
                ADD COLUMN IF NOT EXISTS attribution_id text,
                ADD COLUMN IF NOT EXISTS dedupe_key text,
                ADD COLUMN IF NOT EXISTS event_schema_version smallint NOT NULL DEFAULT 2;
        `);

        // Anomaly / reconciliation findings.
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.anomalies (
                id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                website_id      uuid NOT NULL,
                organization_id uuid NOT NULL,
                detected_at     timestamptz NOT NULL DEFAULT now(),
                kind            text NOT NULL,
                severity        text NOT NULL DEFAULT 'info',
                metric          text,
                observed        numeric,
                expected        numeric,
                deviation       numeric,
                details         jsonb NOT NULL DEFAULT '{}'::jsonb,
                resolved        boolean NOT NULL DEFAULT false,
                created_at      timestamptz NOT NULL DEFAULT now()
            );
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS anomalies_website_detected_idx ON analytics.anomalies (website_id, detected_at DESC);`);
        // One OPEN anomaly per (website, kind, metric) — re-detection updates it in place
        // (partial index; no non-immutable date expression so it is index-legal).
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS anomalies_open_idx
            ON analytics.anomalies (website_id, kind, COALESCE(metric, ''))
            WHERE resolved = false;
        `);

        // Provider sync state: watermark (last synced period) + cost/status for
        // cost-aware, watermarked, partial-failure-tolerant connector syncs.
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.provider_sync_state (
                website_id     uuid NOT NULL,
                provider       text NOT NULL,
                watermark      date,
                last_synced_at timestamptz,
                last_status    text,
                last_error     text,
                rows_written   integer NOT NULL DEFAULT 0,
                calls_today    integer NOT NULL DEFAULT 0,
                calls_date     date,
                created_at     timestamptz NOT NULL DEFAULT now(),
                updated_at     timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (website_id, provider)
            );
        `);
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize;
        await sequelize.query(`DROP TABLE IF EXISTS analytics.provider_sync_state;`);
        await sequelize.query(`DROP TABLE IF EXISTS analytics.anomalies;`);
        await sequelize.query(`
            ALTER TABLE analytics.events
                DROP COLUMN IF EXISTS consent_state,
                DROP COLUMN IF EXISTS fraud_score,
                DROP COLUMN IF EXISTS attribution_id,
                DROP COLUMN IF EXISTS dedupe_key,
                DROP COLUMN IF EXISTS event_schema_version;
        `);
    },
};
