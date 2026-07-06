'use strict';
/**
 * Reporting service — the dashboard read layer.
 *
 * Reads exclusively from the rollup tables (never raw events) except `realtime`,
 * which counts the last few minutes of the partitioned events table directly.
 * Every function is scoped to a single websiteId the caller has already been
 * membership-verified for (loadCmsRole), so no row can cross a tenant boundary.
 */
const { QueryTypes } = require('sequelize');

const num = (v) => (v == null ? 0 : Number(v));

/** KPI summary for a module over [from,to] (inclusive YYYY-MM-DD), site total (dims={}). */
async function overview(websiteId, { from, to, module = 'traffic' }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT
            COALESCE(SUM((metrics->>'pageviews')::numeric), 0)  AS pageviews,
            COALESCE(SUM((metrics->>'visitors')::numeric), 0)   AS visitors,
            COALESCE(SUM((metrics->>'sessions')::numeric), 0)   AS sessions,
            COALESCE(SUM((metrics->>'events')::numeric), 0)     AS events,
            COALESCE(ROUND(AVG(NULLIF((metrics->>'avgSessionS')::numeric, 0))), 0)     AS avg_session_s,
            COALESCE(ROUND(AVG(NULLIF((metrics->>'bounceRate')::numeric, 0))), 0)      AS bounce_rate,
            COALESCE(ROUND(AVG(NULLIF((metrics->>'engagementRate')::numeric, 0))), 0)  AS engagement_rate
        FROM analytics.rollup_daily
        WHERE website_id = :websiteId AND module = :module AND dims = '{}'::jsonb
          AND day >= :from AND day <= :to`,
        { type: QueryTypes.SELECT, replacements: { websiteId, module, from, to } });

    const r = rows[0] || {};
    return {
        pageviews: num(r.pageviews),
        visitors: num(r.visitors),
        sessions: num(r.sessions),
        events: num(r.events),
        avgSessionS: num(r.avg_session_s),
        bounceRate: num(r.bounce_rate),
        engagementRate: num(r.engagement_rate),
    };
}

/** Daily series of one metric for a module (site total). Returns [{ day, value }]. */
async function timeseries(websiteId, { metric = 'pageviews', from, to, module = 'traffic' }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT day, COALESCE((metrics->>:metric)::numeric, 0) AS value
        FROM analytics.rollup_daily
        WHERE website_id = :websiteId AND module = :module AND dims = '{}'::jsonb
          AND day >= :from AND day <= :to
        ORDER BY day ASC`,
        { type: QueryTypes.SELECT, replacements: { websiteId, module, metric, from, to } });
    return rows.map((x) => ({ day: x.day, value: num(x.value) }));
}

/** Top-N breakdown by a dimension for a module. Returns [{ label, value }]. */
async function breakdown(websiteId, { dimension, metric = 'pageviews', from, to, module = 'traffic', limit = 20 }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT dims->>:dimension AS label, COALESCE(SUM((metrics->>:metric)::numeric), 0) AS value
        FROM analytics.rollup_daily
        WHERE website_id = :websiteId AND module = :module
          AND dims->>:dimension IS NOT NULL
          AND day >= :from AND day <= :to
        GROUP BY dims->>:dimension
        ORDER BY value DESC
        LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { websiteId, module, dimension, metric, from, to, limit } });
    return rows.map((x) => ({ label: x.label, value: num(x.value) }));
}

/** Live counts over the last N minutes, straight from the partitioned events table. */
async function realtime(websiteId, { windowMin = 5, topPages = 10 } = {}) {
    const db = require('../../models');
    const [counts] = await db.sequelize.query(`
        SELECT count(DISTINCT visitor_id) AS visitors,
               count(DISTINCT session_id) AS sessions,
               count(*) AS events
        FROM analytics.events
        WHERE website_id = :websiteId
          AND occurred_at >= now() - make_interval(mins => :windowMin)`,
        { type: QueryTypes.SELECT, replacements: { websiteId, windowMin } });

    const pages = await db.sequelize.query(`
        SELECT COALESCE(page, '(unknown)') AS page, count(*) AS views
        FROM analytics.events
        WHERE website_id = :websiteId
          AND event = 'page_view'
          AND occurred_at >= now() - make_interval(mins => :windowMin)
        GROUP BY page
        ORDER BY views DESC
        LIMIT :topPages`,
        { type: QueryTypes.SELECT, replacements: { websiteId, windowMin, topPages } });

    return {
        windowMin,
        activeVisitors: num(counts && counts.visitors),
        activeSessions: num(counts && counts.sessions),
        events: num(counts && counts.events),
        topPages: pages.map((p) => ({ page: p.page, views: num(p.views) })),
    };
}

/** Core Web Vitals averages (module 'seo') over [from,to]. */
async function seoVitals(websiteId, { from, to }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT
            COALESCE(round(avg(NULLIF((metrics->>'lcpAvg')::numeric, 0))), 0) AS lcp,
            COALESCE(round(avg(NULLIF((metrics->>'clsAvg')::numeric, 0))::numeric, 3), 0) AS cls,
            COALESCE(round(avg(NULLIF((metrics->>'inpAvg')::numeric, 0))), 0) AS inp,
            COALESCE(sum((metrics->>'samples')::numeric), 0) AS samples
        FROM analytics.rollup_daily
        WHERE website_id = :websiteId AND module = 'seo' AND dims = '{}'::jsonb
          AND day >= :from AND day <= :to`,
        { type: QueryTypes.SELECT, replacements: { websiteId, from, to } });
    const r = rows[0] || {};
    return { lcp: num(r.lcp), cls: num(r.cls), inp: num(r.inp), samples: num(r.samples) };
}

/** Latest site-total metrics pulled from a provider (dims = {}). Returns { metric: value }. */
async function providerTotals(websiteId, { provider }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT DISTINCT ON (metric) metric, value
        FROM analytics.provider_metrics
        WHERE website_id = :websiteId AND provider = :provider AND dims = '{}'::jsonb
        ORDER BY metric, period_start DESC`,
        { type: QueryTypes.SELECT, replacements: { websiteId, provider } });
    const out = {};
    for (const r of rows) out[r.metric] = num(r.value);
    return out;
}

/** Top-N breakdown from a provider's latest period for one metric+dimension. */
async function providerBreakdown(websiteId, { provider, metric, dimension, limit = 25 }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT dims->>:dimension AS label, value
        FROM analytics.provider_metrics pm
        WHERE website_id = :websiteId AND provider = :provider AND metric = :metric
          AND dims->>:dimension IS NOT NULL
          AND period_start = (
              SELECT max(period_start) FROM analytics.provider_metrics
              WHERE website_id = :websiteId AND provider = :provider AND metric = :metric
                AND dims->>:dimension IS NOT NULL
          )
        ORDER BY value DESC
        LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { websiteId, provider, metric, dimension, limit } });
    return rows.map((x) => ({ label: x.label, value: num(x.value) }));
}

/**
 * Generic site-total metrics for any module — sums every numeric metric key in the
 * dims={} rollup rows over [from,to]. Lets the ecommerce/users/security/marketing
 * tabs read their own metric bags without a per-module reader. (Averages are summed
 * here; the UI recomputes ratios like AOV from the summed base metrics.)
 */
async function moduleTotals(websiteId, { module, from, to }) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT kv.key AS k, sum(kv.value::numeric) AS total
        FROM analytics.rollup_daily r, jsonb_each_text(r.metrics) kv
        WHERE r.website_id = :websiteId AND r.module = :module AND r.dims = '{}'::jsonb
          AND r.day >= :from AND r.day <= :to
          AND kv.value ~ '^-?[0-9]+(\\.[0-9]+)?$'
        GROUP BY kv.key`,
        { type: QueryTypes.SELECT, replacements: { websiteId, module, from, to } });
    const out = {};
    for (const r of rows) out[r.k] = num(r.total);
    return out;
}

/**
 * Infrastructure snapshot (platform-level, admin) — analytics queue depths, recent
 * ingest volume, and event-partition count. Real, in-process; feeds the Infra tab.
 */
async function infra() {
    const db = require('../../models');
    const { health } = require('../../queues/analyticsQueue');
    const queues = await health();
    const [ev] = await db.sequelize.query(
        `SELECT count(*)::bigint AS events_24h FROM analytics.events WHERE occurred_at >= now() - interval '24 hours'`,
        { type: QueryTypes.SELECT });
    const [pc] = await db.sequelize.query(`
        SELECT count(*)::int AS partitions
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
        JOIN pg_class p ON p.oid = i.inhparent
        JOIN pg_namespace n ON n.oid = p.relnamespace
        WHERE n.nspname = 'analytics' AND p.relname = 'events'`,
        { type: QueryTypes.SELECT });
    return { queues, events24h: num(ev && ev.events_24h), partitions: num(pc && pc.partitions) };
}

/** Recent open anomalies for a website (reconciliation findings). */
async function anomalies(websiteId, { limit = 50 } = {}) {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        SELECT kind, severity, metric, observed, expected, deviation, details, detected_at
        FROM analytics.anomalies
        WHERE website_id = :websiteId AND resolved = false
        ORDER BY detected_at DESC
        LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { websiteId, limit } });
    return rows.map((r) => ({
        kind: r.kind,
        severity: r.severity,
        metric: r.metric,
        observed: num(r.observed),
        expected: num(r.expected),
        deviationPct: r.details && r.details.pct != null ? Number(r.details.pct) : Math.round(num(r.deviation) * 1000) / 10,
        detectedAt: r.detected_at,
    }));
}

/** Per-provider sync bookkeeping (watermark, status, daily calls) for a website. */
async function providerState(websiteId) {
    const db = require('../../models');
    const rows = await db.AnalyticsProviderSyncState.findAll({ where: { websiteId }, order: [['provider', 'ASC']] });
    return rows.map((r) => ({
        provider: r.provider,
        watermark: r.watermark,
        lastSyncedAt: r.lastSyncedAt,
        lastStatus: r.lastStatus,
        lastError: r.lastError,
        rowsWritten: r.rowsWritten,
        callsToday: r.callsToday,
    }));
}

module.exports = {
    overview, timeseries, breakdown, realtime, seoVitals, providerTotals, providerBreakdown,
    moduleTotals, infra, anomalies, providerState,
};
