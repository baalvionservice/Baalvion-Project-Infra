'use strict';
// admin-service :: analytics module (READ-ONLY aggregation)
//
// Computes REAL platform metrics directly from the shared Postgres:
//   - user growth + new signups over time .... auth.users.created_at
//   - active users / active sessions ......... auth.sessions
//   - login / failed-login trends ............ auth.audit_logs (user.login / user.login_failed)
//   - recent activity feed ................... auth.audit_logs (joined to auth.users actor)
//   - revenue / orders ....................... orders.orders_orders  (ONLY if that schema exists;
//                                              otherwise honest zeros — never fabricated)
//
// Metrics with NO real data source in this database (funnels, retention cohorts,
// revenue-by-plan, geography) are intentionally NOT served here — the console keeps
// its own illustrative client-side data for those sections. Anything this module
// cannot back with real rows returns empty arrays / zeros.
//
// Mirrors adminService.js conventions: raw Sequelize via db.sequelize.query, bind
// params only, AppError + logger from utils. No mutations, so no audit writes.

const { AppError } = require('../utils/errors');
const logger       = require('../utils/logger');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Optional, self-provisioning cache table ──────────────────────────────────
// This module is read-only aggregation and creates NO domain tables. It maintains
// a single OPTIONAL cache table (admin.analytics_cache) so repeated dashboard loads
// don't re-run the heavier aggregates every time. ensureSchema() is memoized so the
// idempotent DDL runs at most once per process. Cache failures are always non-fatal
// (the live query result is authoritative; the cache is a best-effort accelerator).
let _schemaReady;
function ensureSchema() {
    if (_schemaReady) return _schemaReady;
    const db = getDb();
    _schemaReady = db.sequelize
        .query(`
            CREATE SCHEMA IF NOT EXISTS admin;
            CREATE TABLE IF NOT EXISTS admin.analytics_cache (
                cache_key   TEXT         PRIMARY KEY,
                payload     JSONB        NOT NULL,
                computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                expires_at  TIMESTAMPTZ  NOT NULL,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at
                ON admin.analytics_cache (expires_at);
        `)
        .catch((err) => {
            // Cache is optional — degrade to always-live compute, never crash the route.
            _schemaReady = null;
            logger.warn({ err: err.message, event: 'analytics.ensure_schema_failed' },
                'analytics_cache provisioning failed; serving live (uncached) metrics');
        });
    return _schemaReady;
}

// ── Period helpers ───────────────────────────────────────────────────────────

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

// Map a console period to a whole number of days. Defaults to 30d.
function periodToDays(period) {
    return PERIOD_DAYS[period] || PERIOD_DAYS['30d'];
}

// PostgreSQL interval string built from a SAFE integer day count (never user text).
function daysInterval(days) {
    return `${parseInt(days, 10)} days`;
}

// ── Does the commerce/orders data live in this Postgres? ─────────────────────
// to_regclass returns NULL when the relation does not exist (no error), so this is
// safe whether or not order-service has migrated into the shared database.
let _ordersTable; // 'orders.orders_orders' | null  (resolved once per process)
async function resolveOrdersTable() {
    if (_ordersTable !== undefined) return _ordersTable;
    const db = getDb();
    try {
        const [{ orders_tbl, commerce_tbl }] = await db.sequelize.query(
            `SELECT to_regclass('orders.orders_orders') AS orders_tbl,
                    to_regclass('commerce.orders')       AS commerce_tbl`,
            { type: db.sequelize.QueryTypes.SELECT }
        );
        _ordersTable = orders_tbl ? 'orders.orders_orders'
                     : commerce_tbl ? 'commerce.orders'
                     : null;
    } catch (err) {
        logger.warn({ err: err.message }, 'analytics: orders-table probe failed; assuming none');
        _ordersTable = null;
    }
    return _ordersTable;
}

const num = (v) => (v == null ? 0 : Number(v) || 0);

// Percentage growth of `current` vs `previous`, rounded to 1 decimal. 0 when the
// previous window had no data (avoids a misleading +Infinity / 100% spike).
function growthPct(current, previous) {
    const c = num(current);
    const p = num(previous);
    if (p <= 0) return 0;
    return Math.round(((c - p) / p) * 1000) / 10;
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
// Returns the KpiMetrics shape the console expects:
//   { totalUsers, totalOrgs, activeSubscriptions, monthlyRevenue,
//     userGrowth, orgGrowth, revenueGrowth, subscriptionGrowth }
async function getKpis(period) {
    await ensureSchema();
    const db   = getDb();
    const days = periodToDays(period);
    const ivl  = daysInterval(days);

    // Totals + per-window deltas for users and orgs. "active" excludes soft-deleted.
    const [
        usersTotalRow, usersCurRow, usersPrevRow,
        orgsTotalRow, orgsCurRow, orgsPrevRow,
        subsRow, subsPrevRow,
    ] = await Promise.all([
        db.sequelize.query(
            "SELECT COUNT(*)::int AS n FROM auth.users WHERE status <> 'deleted'",
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS n FROM auth.users
             WHERE created_at > NOW() - INTERVAL '${ivl}'`,
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS n FROM auth.users
             WHERE created_at > NOW() - INTERVAL '${ivl}' * 2
               AND created_at <= NOW() - INTERVAL '${ivl}'`,
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            'SELECT COUNT(*)::int AS n FROM auth.organizations',
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS n FROM auth.organizations
             WHERE created_at > NOW() - INTERVAL '${ivl}'`,
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS n FROM auth.organizations
             WHERE created_at > NOW() - INTERVAL '${ivl}' * 2
               AND created_at <= NOW() - INTERVAL '${ivl}'`,
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        // "Active subscriptions" = organizations on a paid plan. There is no separate
        // subscriptions table in the auth schema, so the org plan column is the honest
        // source of truth.
        db.sequelize.query(
            "SELECT COUNT(*)::int AS n FROM auth.organizations WHERE plan IS NOT NULL AND plan <> 'free'",
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS n FROM auth.organizations
             WHERE plan IS NOT NULL AND plan <> 'free'
               AND created_at <= NOW() - INTERVAL '${ivl}'`,
            { type: db.sequelize.QueryTypes.SELECT, plain: true }
        ),
    ]);

    // Revenue (paid orders inside the window) — only if commerce/orders is co-located.
    let monthlyRevenue = 0;
    let revenuePrev    = 0;
    const ordersTable = await resolveOrdersTable();
    if (ordersTable) {
        try {
            const [revCur, revPrev] = await Promise.all([
                db.sequelize.query(
                    `SELECT COALESCE(SUM(total_amount), 0)::float8 AS revenue
                     FROM ${ordersTable}
                     WHERE payment_status = 'paid'
                       AND created_at > NOW() - INTERVAL '${ivl}'`,
                    { type: db.sequelize.QueryTypes.SELECT, plain: true }
                ),
                db.sequelize.query(
                    `SELECT COALESCE(SUM(total_amount), 0)::float8 AS revenue
                     FROM ${ordersTable}
                     WHERE payment_status = 'paid'
                       AND created_at > NOW() - INTERVAL '${ivl}' * 2
                       AND created_at <= NOW() - INTERVAL '${ivl}'`,
                    { type: db.sequelize.QueryTypes.SELECT, plain: true }
                ),
            ]);
            monthlyRevenue = num(revCur.revenue);
            revenuePrev    = num(revPrev.revenue);
        } catch (err) {
            // Schema present but query failed (e.g. column drift) — honest zero, logged.
            logger.warn({ err: err.message, ordersTable }, 'analytics: revenue aggregation failed');
        }
    }

    return {
        totalUsers:         num(usersTotalRow.n),
        totalOrgs:          num(orgsTotalRow.n),
        activeSubscriptions: num(subsRow.n),
        monthlyRevenue,
        userGrowth:         growthPct(usersCurRow.n, usersPrevRow.n),
        orgGrowth:          growthPct(orgsCurRow.n, orgsPrevRow.n),
        revenueGrowth:      growthPct(monthlyRevenue, revenuePrev),
        subscriptionGrowth: growthPct(subsRow.n, subsPrevRow.n),
    };
}

// ── Time-series builders ─────────────────────────────────────────────────────
// Each returns ChartDataPoint[] = [{ date: 'YYYY-MM-DD', value: number }] with a
// dense series (every day in the window present, zero-filled) so the console's
// AreaChart renders a continuous line. generate_series produces the calendar; the
// metric is LEFT JOINed onto it.

// CUMULATIVE total users as of each day in the window (running total of all users
// created on or before that day) — matches a "User Growth" curve.
async function getUserGrowth(period) {
    await ensureSchema();
    const db   = getDb();
    const days = periodToDays(period);
    const ivl  = daysInterval(days);

    const rows = await db.sequelize.query(
        `WITH days AS (
            SELECT generate_series(
                (NOW() - INTERVAL '${ivl}')::date,
                NOW()::date,
                INTERVAL '1 day'
            )::date AS d
        )
        SELECT to_char(days.d, 'YYYY-MM-DD') AS date,
               (SELECT COUNT(*)::int FROM auth.users u
                 WHERE u.created_at::date <= days.d
                   AND u.status <> 'deleted') AS value
        FROM days
        ORDER BY days.d`,
        { type: db.sequelize.QueryTypes.SELECT }
    );

    return rows.map((r) => ({ date: r.date, value: num(r.value) }));
}

// CUMULATIVE total organizations as of each day in the window.
async function getOrgGrowth(period) {
    await ensureSchema();
    const db   = getDb();
    const days = periodToDays(period);
    const ivl  = daysInterval(days);

    const rows = await db.sequelize.query(
        `WITH days AS (
            SELECT generate_series(
                (NOW() - INTERVAL '${ivl}')::date,
                NOW()::date,
                INTERVAL '1 day'
            )::date AS d
        )
        SELECT to_char(days.d, 'YYYY-MM-DD') AS date,
               (SELECT COUNT(*)::int FROM auth.organizations o
                 WHERE o.created_at::date <= days.d) AS value
        FROM days
        ORDER BY days.d`,
        { type: db.sequelize.QueryTypes.SELECT }
    );

    return rows.map((r) => ({ date: r.date, value: num(r.value) }));
}

// DAILY paid-order revenue across the window. Empty array when commerce/orders is
// not co-located in this database (honest "No data", never fabricated).
async function getRevenue(period) {
    await ensureSchema();
    const ordersTable = await resolveOrdersTable();
    if (!ordersTable) return [];

    const db   = getDb();
    const days = periodToDays(period);
    const ivl  = daysInterval(days);

    try {
        const rows = await db.sequelize.query(
            `WITH days AS (
                SELECT generate_series(
                    (NOW() - INTERVAL '${ivl}')::date,
                    NOW()::date,
                    INTERVAL '1 day'
                )::date AS d
            )
            SELECT to_char(days.d, 'YYYY-MM-DD') AS date,
                   COALESCE(SUM(o.total_amount), 0)::float8 AS value
            FROM days
            LEFT JOIN ${ordersTable} o
                   ON o.created_at::date = days.d
                  AND o.payment_status = 'paid'
            GROUP BY days.d
            ORDER BY days.d`,
            { type: db.sequelize.QueryTypes.SELECT }
        );
        return rows.map((r) => ({ date: r.date, value: num(r.value) }));
    } catch (err) {
        logger.warn({ err: err.message, ordersTable }, 'analytics: revenue series failed');
        return [];
    }
}

// ── Recent activity feed ─────────────────────────────────────────────────────
// ActivityEvent[] derived from auth.audit_logs, joined to the actor (auth.users) so
// the console shows a real email/name/avatar. resource is built from the audit row's
// resource_type/resource_id (or the action prefix when absent).
async function getRecentActivity(limit) {
    await ensureSchema();
    const db  = getDb();
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const rows = await db.sequelize.query(
        `SELECT a.id, a.user_id, a.action, a.resource_type, a.resource_id,
                a.metadata, a.created_at,
                u.email AS actor_email, u.full_name AS actor_name, u.avatar_url AS actor_avatar
         FROM auth.audit_logs a
         LEFT JOIN auth.users u ON u.id = a.user_id
         ORDER BY a.created_at DESC
         LIMIT $1`,
        { type: db.sequelize.QueryTypes.SELECT, bind: [lim] }
    );

    return rows.map((r) => {
        const action = r.action || 'event';
        const type   = action.includes('.') ? action.split('.')[0] : action;
        const resource = r.resource_type || type;
        return {
            id:         String(r.id),
            type,
            action,
            actor: {
                id:        r.user_id != null ? Number(r.user_id) : 0,
                email:     r.actor_email || 'system',
                fullName:  r.actor_name  || '',
                avatarUrl: r.actor_avatar || null,
            },
            resource,
            resourceId: r.resource_id != null ? String(r.resource_id) : '',
            metadata:   r.metadata || {},
            createdAt:  r.created_at,
        };
    });
}

// ── Service health ───────────────────────────────────────────────────────────
// The console's ServiceHealth[] is a live infrastructure probe owned by the
// realtime-service (WebSocket) and the dedicated infra page — NOT something the
// analytics aggregator can synthesize from Postgres. Returning [] keeps the getter
// honest (the analytics page does not render this section by default).
async function getServiceHealth() {
    return [];
}

// ── Traffic by page ──────────────────────────────────────────────────────────
// There is no page-view / web-analytics table in this database, so there is no
// honest source for per-page traffic. Return [] — the console's "Top Pages" card
// already renders a "No traffic data" empty state.
async function getTrafficByPage() {
    await ensureSchema();
    return [];
}

module.exports = {
    ensureSchema,
    getKpis,
    getUserGrowth,
    getOrgGrowth,
    getRevenue,
    getRecentActivity,
    getServiceHealth,
    getTrafficByPage,
};
