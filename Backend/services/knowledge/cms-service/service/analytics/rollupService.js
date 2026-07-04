'use strict';
/**
 * Rollup service — aggregates raw events into the per-module daily/monthly rollup
 * tables the dashboard reads (it never scans raw events).
 *
 * Every statement upserts with a JSONB metric-MERGE (`metrics = existing ||
 * EXCLUDED.metrics`), so passes are additive and idempotent: re-running a day
 * recomputes its keys without disturbing others. Phase 0 ships the `traffic`
 * module rollup (site total + country + device breakdowns); later phases register
 * their own module rollups behind the same runner.
 */
const { logger } = require('../../platform/logger');

const dayStr = (d) => d.toISOString().slice(0, 10);

/** Job entry point. { type:'daily'|'monthly', target?:'recent', day?, month? } */
async function runRollup(job = {}) {
    const type = job.type || 'daily';
    if (type === 'monthly') {
        const months = job.month ? [job.month] : recentMonths();
        for (const m of months) await safe(() => rollupMonth(m), `month ${m}`);
        return { rolled: months.length, type };
    }
    const days = job.day ? [job.day] : recentDays();
    for (const d of days) await safe(() => rollupDay(d), `day ${d}`);
    return { rolled: days.length, type };
}

function recentDays() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86_400_000);
    return [dayStr(yesterday), dayStr(today)];
}

function recentMonths() {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevFirst = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return [dayStr(prevFirst), dayStr(first)];
}

async function safe(fn, label) {
    try { await fn(); } catch (err) {
        logger('analytics-rollup').error({ err: err && err.message, label }, 'rollup segment failed');
        throw err; // let BullMQ retry the whole job
    }
}

const MERGE_DAILY = `ON CONFLICT (website_id, module, day, dims_hash)
    DO UPDATE SET metrics = analytics.rollup_daily.metrics || EXCLUDED.metrics, updated_at = now()`;

// Traffic breakdown dimensions computed from raw events. dimKey/dimExpr are
// code-controlled (never user input), so interpolation is safe.
const EVENT_DIMENSIONS = [
    { key: 'page', expr: "COALESCE(NULLIF(e.page, ''), '(none)')" },
    { key: 'country', expr: "COALESCE(NULLIF(e.geo->>'country', ''), 'unknown')" },
    { key: 'deviceType', expr: "COALESCE(NULLIF(e.device->>'type', ''), 'unknown')" },
    { key: 'browser', expr: "COALESCE(NULLIF(e.device->>'browser', ''), 'unknown')" },
    { key: 'os', expr: "COALESCE(NULLIF(e.device->>'os', ''), 'unknown')" },
    { key: 'channel', expr: "COALESCE(NULLIF(e.campaign->>'channel', ''), 'direct')" },
    { key: 'referrerHost', expr: "COALESCE(NULLIF(split_part(regexp_replace(e.referrer, '^https?://', ''), '/', 1), ''), '(direct)')" },
    { key: 'language', expr: "COALESCE(NULLIF(e.geo->>'lang', ''), 'unknown')" },
    { key: 'campaign', expr: "COALESCE(NULLIF(e.campaign->>'campaign', ''), '(none)')" },
];

// Content-view breakdown dimensions, read from the content_view event metadata.
const CONTENT_DIMENSIONS = [
    { key: 'content', expr: "COALESCE(NULLIF(e.metadata->>'title', ''), NULLIF(e.metadata->>'slug', ''), e.metadata->>'contentId', 'unknown')" },
    { key: 'author', expr: "COALESCE(NULLIF(e.metadata->>'authorId', ''), 'unknown')" },
    { key: 'category', expr: "COALESCE(NULLIF(e.metadata->>'categoryName', ''), NULLIF(e.metadata->>'categoryId', ''), 'unknown')" },
    { key: 'contentType', expr: "COALESCE(NULLIF(e.metadata->>'contentType', ''), 'unknown')" },
];

/** One event-based traffic breakdown for a day (pageviews/sessions/visitors). */
async function eventBreakdown(sequelize, day, dimKey, dimExpr) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'traffic', :day::date,
               jsonb_build_object('${dimKey}', ${dimExpr}),
               jsonb_build_object(
                   'pageviews', count(*) FILTER (WHERE e.event = 'page_view'),
                   'sessions', count(DISTINCT e.session_id),
                   'visitors', count(DISTINCT e.visitor_id)
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'traffic'
        GROUP BY e.website_id, e.organization_id, ${dimExpr}
        ${MERGE_DAILY}`, { replacements: { day } });
}

/** One content-view breakdown by a metadata dimension for a day. */
async function contentBreakdown(sequelize, day, dimKey, dimExpr) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'content', :day::date,
               jsonb_build_object('${dimKey}', ${dimExpr}),
               jsonb_build_object('views', count(*))
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'content' AND e.event = 'content_view'
        GROUP BY e.website_id, e.organization_id, ${dimExpr}
        ${MERGE_DAILY}`, { replacements: { day } });
}

/** Content-module rollup for a day: site total + top content/author/category/type. */
async function rollupContent(sequelize, day) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'content', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'views', count(*),
                   'contentCount', count(DISTINCT e.metadata->>'contentId')
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'content' AND e.event = 'content_view'
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: { day } });

    for (const dim of CONTENT_DIMENSIONS) {
        await contentBreakdown(sequelize, day, dim.key, dim.expr);
    }
}

/** SEO-module rollup for a day: Core Web Vitals averages from beacon web_vitals events. */
async function rollupSeo(sequelize, day) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'seo', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'lcpAvg', COALESCE(round(avg(NULLIF((e.metadata->>'lcp')::numeric, 0))), 0),
                   'clsAvg', COALESCE(round(avg((e.metadata->>'cls')::numeric)::numeric, 3), 0),
                   'inpAvg', COALESCE(round(avg(NULLIF((e.metadata->>'inp')::numeric, 0))), 0),
                   'samples', count(*)
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'seo' AND e.event = 'web_vitals'
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: { day } });
}

/** Ecommerce-module rollup for a day (from beacon purchase/cart/checkout events). */
async function rollupEcommerce(sequelize, day) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'ecommerce', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'revenue', COALESCE(round(sum(e.value_num) FILTER (WHERE e.event = 'purchase'), 2), 0),
                   'orders', count(*) FILTER (WHERE e.event = 'purchase'),
                   'addToCart', count(*) FILTER (WHERE e.event = 'add_to_cart'),
                   'checkouts', count(*) FILTER (WHERE e.event = 'begin_checkout')
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'ecommerce'
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: { day } });

    // Revenue by currency and by country.
    for (const [key, expr] of [
        ['currency', "COALESCE(NULLIF(e.currency, ''), 'unknown')"],
        ['country', "COALESCE(NULLIF(e.geo->>'country', ''), 'unknown')"],
    ]) {
        await sequelize.query(`
            INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
            SELECT e.website_id, e.organization_id, 'ecommerce', :day::date,
                   jsonb_build_object('${key}', ${expr}),
                   jsonb_build_object(
                       'revenue', COALESCE(round(sum(e.value_num) FILTER (WHERE e.event = 'purchase'), 2), 0),
                       'orders', count(*) FILTER (WHERE e.event = 'purchase')
                   )
            FROM analytics.events e
            WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
              AND e.module = 'ecommerce'
            GROUP BY e.website_id, e.organization_id, ${expr}
            ${MERGE_DAILY}`, { replacements: { day } });
    }
}

/** Users-module rollup for a day (known vs anonymous, across all modules). */
async function rollupUsers(sequelize, day) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'users', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'knownUsers', count(DISTINCT e.user_id),
                   'loggedInEvents', count(*) FILTER (WHERE e.user_id IS NOT NULL),
                   'anonEvents', count(*) FILTER (WHERE e.user_id IS NULL)
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: { day } });
}

/** Security-module rollup for a day (bot vs human traffic, from device signals). */
async function rollupSecurity(sequelize, day) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'security', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'botEvents', count(*) FILTER (WHERE e.device->>'type' = 'bot'),
                   'humanEvents', count(*) FILTER (WHERE e.device->>'type' IS DISTINCT FROM 'bot')
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'traffic'
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: { day } });
}

/** One session-based breakdown (landing/exit pages) for a day. */
async function sessionBreakdown(sequelize, day, dimKey, column) {
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT s.website_id, s.organization_id, 'traffic', :day::date,
               jsonb_build_object('${dimKey}', COALESCE(NULLIF(s.${column}, ''), '(none)')),
               jsonb_build_object('sessions', count(*), 'visitors', count(DISTINCT s.visitor_id))
        FROM analytics.sessions s
        WHERE s.started_at >= :day::date AND s.started_at < (:day::date + interval '1 day')
        GROUP BY s.website_id, s.organization_id, COALESCE(NULLIF(s.${column}, ''), '(none)')
        ${MERGE_DAILY}`, { replacements: { day } });
}

async function rollupDay(day) {
    const db = require('../../models');
    const { sequelize } = db;
    const win = { day };

    // Site total from raw events.
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT e.website_id, e.organization_id, 'traffic', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'events', count(*),
                   'pageviews', count(*) FILTER (WHERE e.event = 'page_view'),
                   'sessions', count(DISTINCT e.session_id),
                   'visitors', count(DISTINCT e.visitor_id)
               )
        FROM analytics.events e
        WHERE e.occurred_at >= :day::date AND e.occurred_at < (:day::date + interval '1 day')
          AND e.module = 'traffic'
        GROUP BY e.website_id, e.organization_id
        ${MERGE_DAILY}`, { replacements: win });

    // Session-derived quality metrics merged onto the same site-total row.
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        SELECT s.website_id, s.organization_id, 'traffic', :day::date, '{}'::jsonb,
               jsonb_build_object(
                   'avgSessionS', COALESCE(round(avg(s.duration_s))::int, 0),
                   'bounceRate', COALESCE(round(100.0 * count(*) FILTER (WHERE s.bounced) / NULLIF(count(*), 0))::int, 0),
                   'engagementRate', COALESCE(round(100.0 * count(*) FILTER (WHERE s.engaged) / NULLIF(count(*), 0))::int, 0),
                   'returningVisitors', count(*) FILTER (WHERE s.visitor_id IN (
                       SELECT visitor_id FROM analytics.visitors v
                       WHERE v.website_id = s.website_id AND v.is_returning
                   ))
               )
        FROM analytics.sessions s
        WHERE s.started_at >= :day::date AND s.started_at < (:day::date + interval '1 day')
        GROUP BY s.website_id, s.organization_id
        ${MERGE_DAILY}`, { replacements: win });

    // Event-based dimension breakdowns (pages, country, device, browser, os,
    // channel, referrer host, language).
    for (const dim of EVENT_DIMENSIONS) {
        await eventBreakdown(sequelize, day, dim.key, dim.expr);
    }

    // Session-based breakdowns (landing + exit pages).
    await sessionBreakdown(sequelize, day, 'landingPage', 'landing_page');
    await sessionBreakdown(sequelize, day, 'exitPage', 'exit_page');

    // Content module (article views by content/author/category/type).
    await rollupContent(sequelize, day);

    // SEO module (Core Web Vitals averages).
    await rollupSeo(sequelize, day);

    // Ecommerce, Users, Security modules (first-party derived).
    await rollupEcommerce(sequelize, day);
    await rollupUsers(sequelize, day);
    await rollupSecurity(sequelize, day);

    logger('analytics-rollup').debug({ day }, 'daily module rollups complete');
}

async function rollupMonth(month) {
    const db = require('../../models');
    const { sequelize } = db;
    // Aggregate the month directly from events for accurate distinct counts.
    await sequelize.query(`
        INSERT INTO analytics.rollup_monthly (website_id, organization_id, module, month, dims, metrics)
        SELECT e.website_id, e.organization_id, 'traffic', date_trunc('month', :month::date)::date, '{}'::jsonb,
               jsonb_build_object(
                   'events', count(*),
                   'pageviews', count(*) FILTER (WHERE e.event = 'page_view'),
                   'sessions', count(DISTINCT e.session_id),
                   'visitors', count(DISTINCT e.visitor_id)
               )
        FROM analytics.events e
        WHERE e.occurred_at >= date_trunc('month', :month::date)
          AND e.occurred_at < (date_trunc('month', :month::date) + interval '1 month')
        GROUP BY e.website_id, e.organization_id
        ON CONFLICT (website_id, module, month, dims_hash)
        DO UPDATE SET metrics = analytics.rollup_monthly.metrics || EXCLUDED.metrics, updated_at = now()`,
        { replacements: { month } });

    logger('analytics-rollup').debug({ month }, 'monthly traffic rollup complete');
}

module.exports = { runRollup, rollupDay, rollupMonth };
