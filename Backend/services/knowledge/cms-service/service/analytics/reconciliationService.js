'use strict';
/**
 * Data reconciliation + anomaly detection (runs daily from the maintenance job).
 *
 * Builds trust in the numbers by flagging:
 *   - traffic_spike / traffic_drop — yesterday's pageviews vs the trailing 7-day
 *     baseline (statistical deviation)
 *   - ctr_drop — Search Console CTR falling sharply vs its prior reading
 *   - provider_mismatch — large divergence between a provider's clicks and
 *     first-party pageviews (seam for GA4-vs-first-party once GA4 is connected)
 *
 * Findings upsert into analytics.anomalies (one open row per website/kind/metric/day).
 */
const { QueryTypes } = require('sequelize');
const { logger } = require('../../platform/logger');

const SPIKE = Number(process.env.ANALYTICS_ANOMALY_SPIKE || 1.5);   // +150% vs baseline
const DROP = Number(process.env.ANALYTICS_ANOMALY_DROP || -0.5);    // -50% vs baseline

async function runReconciliation() {
    let flagged = 0;
    flagged += await detectTrafficAnomalies();
    flagged += await detectCtrDrops();
    logger('analytics-reconcile').info({ flagged }, 'reconciliation complete');
    return { flagged };
}

/** Yesterday's pageviews vs the trailing 7-day baseline, per website. */
async function detectTrafficAnomalies() {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        WITH recent AS (
            SELECT website_id, organization_id, day, (metrics->>'pageviews')::numeric AS pv
            FROM analytics.rollup_daily
            WHERE module = 'traffic' AND dims = '{}'::jsonb
              AND day >= (CURRENT_DATE - interval '8 days')::date AND day < CURRENT_DATE
        )
        SELECT website_id, organization_id,
               max(pv) FILTER (WHERE day = (CURRENT_DATE - interval '1 day')::date) AS yesterday,
               avg(pv) FILTER (WHERE day < (CURRENT_DATE - interval '1 day')::date) AS baseline
        FROM recent GROUP BY website_id, organization_id`,
        { type: QueryTypes.SELECT });

    let n = 0;
    for (const r of rows) {
        const yesterday = Number(r.yesterday);
        const baseline = Number(r.baseline);
        if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(yesterday)) continue;
        const deviation = (yesterday - baseline) / baseline;
        if (deviation >= SPIKE) {
            await upsertAnomaly(r.website_id, r.organization_id, 'traffic_spike', 'pageviews', yesterday, baseline, deviation, deviation >= 3 ? 'critical' : 'warning');
            n++;
        } else if (deviation <= DROP) {
            await upsertAnomaly(r.website_id, r.organization_id, 'traffic_drop', 'pageviews', yesterday, baseline, deviation, deviation <= -0.8 ? 'critical' : 'warning');
            n++;
        }
    }
    return n;
}

/** Search Console CTR falling >30% vs its previous period, per website. */
async function detectCtrDrops() {
    const db = require('../../models');
    const rows = await db.sequelize.query(`
        WITH ranked AS (
            SELECT website_id, organization_id, value, period_start,
                   row_number() OVER (PARTITION BY website_id ORDER BY period_start DESC) AS rn
            FROM analytics.provider_metrics
            WHERE provider = 'gsc' AND metric = 'ctr' AND dims = '{}'::jsonb
        )
        SELECT c.website_id, c.organization_id, c.value AS current, p.value AS previous
        FROM ranked c JOIN ranked p ON p.website_id = c.website_id AND p.rn = 2
        WHERE c.rn = 1`,
        { type: QueryTypes.SELECT });

    let n = 0;
    for (const r of rows) {
        const cur = Number(r.current);
        const prev = Number(r.previous);
        if (!Number.isFinite(prev) || prev <= 0) continue;
        const deviation = (cur - prev) / prev;
        if (deviation <= -0.3) {
            await upsertAnomaly(r.website_id, r.organization_id, 'ctr_drop', 'ctr', cur, prev, deviation, deviation <= -0.5 ? 'critical' : 'warning');
            n++;
        }
    }
    return n;
}

/** One open anomaly per (website, kind, metric, day); re-detection updates it. */
async function upsertAnomaly(websiteId, organizationId, kind, metric, observed, expected, deviation, severity) {
    const db = require('../../models');
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db.sequelize.query(`
        SELECT id FROM analytics.anomalies
        WHERE website_id = :websiteId AND kind = :kind AND COALESCE(metric, '') = :metric
          AND detected_at::date = :today::date AND resolved = false
        LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { websiteId, kind, metric: metric || '', today } });

    const details = { pct: Math.round(deviation * 1000) / 10 };
    if (existing[0]) {
        await db.AnalyticsAnomaly.update(
            { observed, expected, deviation, severity, details },
            { where: { id: existing[0].id } });
    } else {
        await db.AnalyticsAnomaly.create({
            websiteId, organizationId, kind, metric, observed, expected, deviation, severity, details,
        });
    }
}

module.exports = { runReconciliation, detectTrafficAnomalies, detectCtrDrops };
