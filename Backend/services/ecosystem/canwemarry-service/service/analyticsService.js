'use strict';
const db = require('../models');
const { badRequest } = require('../utils/errors');

/**
 * Aggregated product health.
 *
 * Three rules shape everything here, and they are worth stating because each rules out
 * something that would otherwise be easy to build.
 *
 * 1. **Aggregates only, computed in SQL.** Every number below is a `COUNT` or a percentile
 *    over the whole table. Nothing loads rows and counts them in JavaScript: a number
 *    derived from one page of results would be a statement about that page while looking
 *    like a statement about the database.
 *
 * 2. **Nothing identifies anybody.** There is no per-user breakdown, no "top" anything, no
 *    way to go from a number here to a person. Participation in this product means having
 *    told the platform that your family opposes your relationship; a dashboard that let
 *    staff browse that by person would be surveillance, whatever it was called.
 *
 * 3. **Every metric means one specific thing**, written down beside it. "Active" without a
 *    window is a vanity number, and a vanity number in a safety product is worse than none.
 *
 * There are deliberately no rankings, no leaderboards, no engagement scores and no growth
 * framing. The question this answers is "is the product healthy and is the queue safe", not
 * "is it growing".
 */

/** Windows the dashboard offers. Everything is UTC — the database stores timestamptz. */
const WINDOWS = Object.freeze({
    '24h': { hours: 24, label: 'Last 24 hours' },
    '7d': { hours: 24 * 7, label: 'Last 7 days' },
    '30d': { hours: 24 * 30, label: 'Last 30 days' },
    '90d': { hours: 24 * 90, label: 'Last 90 days' },
});

/**
 * What each number means, shipped WITH the numbers so the dashboard cannot describe them
 * differently from how they are computed. If a definition and its query ever disagree, that
 * is a bug in one place rather than a disagreement between a document and the code.
 */
const DEFINITIONS = Object.freeze({
    'users.registered': 'Accounts whose local record was created in the window. One row per account, never a person.',
    'users.active': 'Accounts with a recorded last-seen timestamp inside the window. Reading a page updates it; it is presence, not engagement.',
    'users.suspended': 'Accounts whose suspension is in force RIGHT NOW — status SUSPENDED and either no expiry or an expiry still in the future. This matches what the authentication middleware actually enforces.',
    'cases.created': 'Cases whose row was created in the window, at any status including DRAFT.',
    'cases.opened': 'Cases currently at status OPEN. A point-in-time count, not a rate.',
    'cases.draft': 'Cases currently at status DRAFT. Visible to nobody but their author.',
    'cases.resolved': 'Cases currently at status RESOLVED — the author marked their situation resolved.',
    'cases.closed': 'Cases currently at status CLOSED.',
    'cases.underReview': 'Cases a moderator has placed under review. Still readable by their participants.',
    'support.offered': 'Support offers created in the window, at any status.',
    'support.accepted': 'Support relationships currently at status ACCEPTED.',
    'support.withdrawn': 'Support relationships currently at status WITHDRAWN.',
    'support.perOpenCase': 'Accepted supporters divided by open cases, to one decimal place. Zero when no case is open. A workload figure, not a score.',
    'community.total': 'Communities currently active, at any visibility. A point-in-time count, not a rate.',
    'community.memberships': 'Memberships currently active. A person in three communities counts three times; this is a size figure, not a headcount of people.',
    'community.posts': 'Posts created in the window, excluding deleted ones.',
    'community.comments': 'Comments created in the window, excluding removed ones.',
    'community.withActivity': 'Communities with at least one post inside the window.',
    'safety.reports': 'Reports created in the window.',
    'safety.open': 'Reports currently at status OPEN or TRIAGED — everything still waiting on a decision.',
    'safety.resolved': 'Reports currently at status ACTIONED or DISMISSED.',
    'safety.critical': 'Reports currently awaiting a decision at severity CRITICAL: threats, coercion or self-harm risk, raised automatically when the report is filed.',
    'safety.medianResolutionHours': 'Median hours between a report being created and being resolved, over reports RESOLVED in the window. Null when fewer than three have been resolved — a median of one or two is not a median.',
    'safety.oldestOpenHours': 'Age in hours of the oldest report still awaiting a decision. The number that says whether the queue is safe.',
    'safety.actions': 'Moderation actions recorded in the window, of every kind.',
});

function windowStart(key) {
    const w = WINDOWS[key];
    if (!w) throw badRequest(`Unknown window '${key}'. Use one of: ${Object.keys(WINDOWS).join(', ')}.`);
    return new Date(Date.now() - w.hours * 3600 * 1000);
}

const num = (v) => Number(v ?? 0);

/**
 * One round trip per group rather than one per metric.
 *
 * Each query is a single row of counts over an indexed column. `FILTER (WHERE …)` keeps them
 * in one scan per table instead of one per metric, which is what makes this cheap enough to
 * run on a page load.
 */
async function collect(since) {
    const q = (sql) => db.sequelize.query(sql, {
        replacements: { since },
        type: db.sequelize.QueryTypes.SELECT,
        plain: true,
    });

    const [users, cases, support, community, reports, actions, resolution] = await Promise.all([
        q(`SELECT
             count(*) FILTER (WHERE created_at >= :since)                         AS registered,
             count(*) FILTER (WHERE last_seen_at >= :since)                       AS active,
             count(*) FILTER (WHERE status = 'SUSPENDED'
                              AND (suspended_until IS NULL OR suspended_until > now())) AS suspended,
             count(*)                                                             AS total
           FROM canwemarry.users`),

        q(`SELECT
             count(*) FILTER (WHERE created_at >= :since)          AS created,
             count(*) FILTER (WHERE status = 'OPEN')               AS opened,
             count(*) FILTER (WHERE status = 'DRAFT')              AS draft,
             count(*) FILTER (WHERE status = 'RESOLVED')           AS resolved,
             count(*) FILTER (WHERE status = 'CLOSED')             AS closed,
             count(*) FILTER (WHERE moderation_state = 'UNDER_REVIEW') AS under_review
           FROM canwemarry.cases`),

        q(`SELECT
             count(*) FILTER (WHERE created_at >= :since)      AS offered,
             count(*) FILTER (WHERE status = 'ACCEPTED')       AS accepted,
             count(*) FILTER (WHERE status = 'WITHDRAWN')      AS withdrawn
           FROM canwemarry.case_supporters`),

        q(`SELECT
             (SELECT count(*) FROM canwemarry.communities WHERE is_active)                       AS communities,
             (SELECT count(*) FROM canwemarry.community_members WHERE status = 'ACTIVE')         AS memberships,
             (SELECT count(*) FROM canwemarry.posts
               WHERE created_at >= :since AND deleted_at IS NULL)                                AS posts,
             (SELECT count(*) FROM canwemarry.comments
               WHERE created_at >= :since AND moderation_state <> 'REMOVED')                     AS comments,
             (SELECT count(DISTINCT community_id) FROM canwemarry.posts
               WHERE created_at >= :since AND deleted_at IS NULL)                                AS with_activity`),

        q(`SELECT
             count(*) FILTER (WHERE created_at >= :since)                    AS created,
             count(*) FILTER (WHERE status IN ('OPEN','TRIAGED'))            AS open,
             count(*) FILTER (WHERE status IN ('ACTIONED','DISMISSED'))      AS resolved,
             count(*) FILTER (WHERE status IN ('OPEN','TRIAGED')
                              AND severity = 'CRITICAL')                     AS critical,
             EXTRACT(EPOCH FROM (now() - min(created_at)
               FILTER (WHERE status IN ('OPEN','TRIAGED')))) / 3600          AS oldest_open_hours
           FROM canwemarry.reports`),

        q(`SELECT count(*) AS taken FROM canwemarry.moderation_actions WHERE created_at >= :since`),

        // Median rather than mean: one report that sat over a holiday weekend would drag an
        // average somewhere misleading, and the question is what a typical wait looks like.
        q(`SELECT
             count(*) AS n,
             percentile_cont(0.5) WITHIN GROUP (
               ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
             ) AS median_hours
           FROM canwemarry.reports
           WHERE resolved_at IS NOT NULL AND resolved_at >= :since`),
    ]);

    return { users, cases, support, community, reports, actions, resolution };
}

async function overview(windowKey = '30d') {
    const since = windowStart(windowKey);
    const r = await collect(since);

    const openCases = num(r.cases.opened);
    const accepted = num(r.support.accepted);

    return {
        window: { key: windowKey, label: WINDOWS[windowKey].label, since: since.toISOString(), timezone: 'UTC' },
        users: {
            registered: num(r.users.registered),
            active: num(r.users.active),
            suspended: num(r.users.suspended),
            total: num(r.users.total),
        },
        cases: {
            created: num(r.cases.created),
            opened: openCases,
            draft: num(r.cases.draft),
            resolved: num(r.cases.resolved),
            closed: num(r.cases.closed),
            underReview: num(r.cases.under_review),
        },
        support: {
            offered: num(r.support.offered),
            accepted,
            withdrawn: num(r.support.withdrawn),
            // Zero rather than a division by zero, and one decimal because two would imply
            // a precision this does not have.
            perOpenCase: openCases === 0 ? 0 : Math.round((accepted / openCases) * 10) / 10,
        },
        community: {
            total: num(r.community.communities),
            memberships: num(r.community.memberships),
            posts: num(r.community.posts),
            comments: num(r.community.comments),
            withActivity: num(r.community.with_activity),
        },
        safety: {
            reports: num(r.reports.created),
            open: num(r.reports.open),
            resolved: num(r.reports.resolved),
            critical: num(r.reports.critical),
            actions: num(r.actions.taken),
            // Null, not zero, when there is nothing to measure. Zero would read as "instant".
            medianResolutionHours: num(r.resolution.n) >= 3
                ? Math.round(Number(r.resolution.median_hours) * 10) / 10
                : null,
            oldestOpenHours: r.reports.oldest_open_hours === null
                ? null
                : Math.round(Number(r.reports.oldest_open_hours) * 10) / 10,
        },
    };
}

/** Reports grouped by reason. A category count, never a list of who reported what. */
async function reportsByReason(windowKey = '30d') {
    const since = windowStart(windowKey);
    const rows = await db.sequelize.query(
        `SELECT reason, count(*)::int AS count
         FROM canwemarry.reports
         WHERE created_at >= :since
         GROUP BY reason
         ORDER BY count DESC, reason ASC`,
        { replacements: { since }, type: db.sequelize.QueryTypes.SELECT },
    );
    return rows.map((r) => ({ reason: r.reason, count: r.count }));
}

module.exports = { overview, reportsByReason, WINDOWS, DEFINITIONS };
