'use strict';

/**
 * Unified Analytics Platform — Phase 0 foundation.
 *
 * Creates a dedicated `analytics` schema (owned by cms-service) holding the
 * event spine every analytics module reads from:
 *
 *   analytics.events            raw, append-only, RANGE-partitioned by month
 *   analytics.sessions          first-party session rollup (worker-maintained)
 *   analytics.visitors          per-website visitor identity (worker-maintained)
 *   analytics.provider_metrics  pulled series from external providers (GA4/GSC/…)
 *   analytics.rollup_daily      per-module daily aggregation (the dashboard reads this)
 *   analytics.rollup_monthly    per-module monthly aggregation
 *
 * Tenancy: every table carries website_id + organization_id NOT NULL and is
 * scoped at the service layer (loadCmsRole membership + orgFilter), matching the
 * rest of cms-service. Tables are RLS-ready — @baalvion/tenancy `enableRlsSql`
 * can be layered on later without a schema change.
 *
 * Partitioning is native declarative RANGE(occurred_at); a plpgsql helper
 * `analytics.ensure_events_partition(month)` creates a monthly partition + its
 * indexes idempotently, driven at runtime by the analytics maintenance job.
 */
module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;

        await sequelize.query('CREATE SCHEMA IF NOT EXISTS analytics;');

        // ── events: RANGE-partitioned parent ──────────────────────────────────
        // timestamps:false on the model → no created_at/updated_at; received_at
        // is the server ingest stamp. PK must include the partition key.
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.events (
                event_id        uuid NOT NULL DEFAULT gen_random_uuid(),
                occurred_at     timestamptz NOT NULL,
                received_at     timestamptz NOT NULL DEFAULT now(),
                website_id      uuid NOT NULL,
                organization_id uuid NOT NULL,
                provider        text NOT NULL DEFAULT 'first_party',
                event           text NOT NULL,
                module          text NOT NULL DEFAULT 'traffic',
                user_id         bigint,
                session_id      text,
                visitor_id      text,
                page            text,
                url             text,
                referrer        text,
                campaign        jsonb NOT NULL DEFAULT '{}'::jsonb,
                geo             jsonb NOT NULL DEFAULT '{}'::jsonb,
                device          jsonb NOT NULL DEFAULT '{}'::jsonb,
                value_num       numeric,
                currency        text,
                metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
                PRIMARY KEY (event_id, occurred_at)
            ) PARTITION BY RANGE (occurred_at);
        `);

        // Partition-ensure helper — creates one month's partition + indexes if absent.
        await sequelize.query(`
            CREATE OR REPLACE FUNCTION analytics.ensure_events_partition(p_month date)
            RETURNS void
            LANGUAGE plpgsql
            AS $fn$
            DECLARE
                start_date date := date_trunc('month', p_month)::date;
                end_date   date := (date_trunc('month', p_month) + interval '1 month')::date;
                part_name  text := 'events_' || to_char(date_trunc('month', p_month), 'YYYYMM');
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'analytics' AND c.relname = part_name
                ) THEN
                    EXECUTE format(
                        'CREATE TABLE analytics.%I PARTITION OF analytics.events FOR VALUES FROM (%L) TO (%L)',
                        part_name, start_date, end_date);
                    EXECUTE format(
                        'CREATE INDEX %I ON analytics.%I (website_id, occurred_at)',
                        part_name || '_website_occurred_idx', part_name);
                    EXECUTE format(
                        'CREATE INDEX %I ON analytics.%I (website_id, event, occurred_at)',
                        part_name || '_website_event_idx', part_name);
                    EXECUTE format(
                        'CREATE INDEX %I ON analytics.%I (website_id, session_id)',
                        part_name || '_website_session_idx', part_name);
                END IF;
            END;
            $fn$;
        `);

        // Seed partitions: previous month through +3 months, plus a DEFAULT catch-all
        // so ingestion never fails on a missing partition before maintenance runs.
        await sequelize.query(`
            DO $do$
            DECLARE m date;
            BEGIN
                FOR m IN
                    SELECT generate_series(
                        date_trunc('month', now()) - interval '1 month',
                        date_trunc('month', now()) + interval '3 months',
                        interval '1 month'
                    )::date
                LOOP
                    PERFORM analytics.ensure_events_partition(m);
                END LOOP;
            END
            $do$;
        `);
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.events_default
            PARTITION OF analytics.events DEFAULT;
        `);

        // ── sessions ─────────────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.sessions (
                website_id      uuid NOT NULL,
                session_id      text NOT NULL,
                organization_id uuid NOT NULL,
                visitor_id      text,
                started_at      timestamptz NOT NULL,
                ended_at        timestamptz,
                duration_s      integer NOT NULL DEFAULT 0,
                pageviews       integer NOT NULL DEFAULT 0,
                landing_page    text,
                exit_page       text,
                bounced         boolean NOT NULL DEFAULT true,
                engaged         boolean NOT NULL DEFAULT false,
                geo             jsonb NOT NULL DEFAULT '{}'::jsonb,
                device          jsonb NOT NULL DEFAULT '{}'::jsonb,
                campaign        jsonb NOT NULL DEFAULT '{}'::jsonb,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (website_id, session_id)
            );
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS sessions_website_started_idx ON analytics.sessions (website_id, started_at);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS sessions_visitor_idx ON analytics.sessions (website_id, visitor_id);`);

        // ── visitors ─────────────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.visitors (
                website_id      uuid NOT NULL,
                visitor_id      text NOT NULL,
                organization_id uuid NOT NULL,
                first_seen      timestamptz NOT NULL,
                last_seen       timestamptz NOT NULL,
                sessions_count  integer NOT NULL DEFAULT 0,
                is_returning    boolean NOT NULL DEFAULT false,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (website_id, visitor_id)
            );
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS visitors_website_last_seen_idx ON analytics.visitors (website_id, last_seen);`);

        // ── provider_metrics ─────────────────────────────────────────────────
        // dims_hash is a generated column so the unique key can span an arbitrary
        // JSONB dimension object deterministically.
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.provider_metrics (
                id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                website_id      uuid NOT NULL,
                organization_id uuid NOT NULL,
                provider        text NOT NULL,
                metric          text NOT NULL,
                dims            jsonb NOT NULL DEFAULT '{}'::jsonb,
                dims_hash       text GENERATED ALWAYS AS (md5(dims::text)) STORED,
                value           numeric NOT NULL DEFAULT 0,
                granularity     text NOT NULL DEFAULT 'day',
                period_start    date NOT NULL,
                period_end      date NOT NULL,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now()
            );
        `);
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS provider_metrics_unique
            ON analytics.provider_metrics (website_id, provider, metric, granularity, period_start, dims_hash);
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS provider_metrics_lookup_idx ON analytics.provider_metrics (website_id, provider, period_start);`);

        // ── rollup_daily ─────────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.rollup_daily (
                id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                website_id      uuid NOT NULL,
                organization_id uuid NOT NULL,
                module          text NOT NULL,
                day             date NOT NULL,
                dims            jsonb NOT NULL DEFAULT '{}'::jsonb,
                dims_hash       text GENERATED ALWAYS AS (md5(dims::text)) STORED,
                metrics         jsonb NOT NULL DEFAULT '{}'::jsonb,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now()
            );
        `);
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS rollup_daily_unique
            ON analytics.rollup_daily (website_id, module, day, dims_hash);
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS rollup_daily_lookup_idx ON analytics.rollup_daily (website_id, module, day);`);

        // ── rollup_monthly ───────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS analytics.rollup_monthly (
                id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                website_id      uuid NOT NULL,
                organization_id uuid NOT NULL,
                module          text NOT NULL,
                month           date NOT NULL,
                dims            jsonb NOT NULL DEFAULT '{}'::jsonb,
                dims_hash       text GENERATED ALWAYS AS (md5(dims::text)) STORED,
                metrics         jsonb NOT NULL DEFAULT '{}'::jsonb,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now()
            );
        `);
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS rollup_monthly_unique
            ON analytics.rollup_monthly (website_id, module, month, dims_hash);
        `);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS rollup_monthly_lookup_idx ON analytics.rollup_monthly (website_id, module, month);`);
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize;
        // Dropping the schema cascades every table, partition, index and the
        // ensure_events_partition function created above.
        await sequelize.query('DROP SCHEMA IF EXISTS analytics CASCADE;');
    },
};
