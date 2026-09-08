'use strict';
const db = require('../models');

/**
 * What a moderator needs to know before opening anything.
 *
 * The hard constraint here is that a DASHBOARD IS SEEN MORE OFTEN THAN IT IS ACTED ON. It
 * sits on a screen; people walk past it. So nothing in this file returns case titles,
 * participant identities, community membership, email addresses or report details — only
 * counts, ages, and the type of thing involved. "3 reports require review" tells a moderator
 * everything they need to decide what to do next; "3 reports about Allen and Tamanna" tells
 * the room.
 *
 * It also does not rank anybody. There is no "actions taken by moderator", no resolution
 * league table, nothing that would turn careful review into a race. Recent activity is shown
 * as WHAT was decided, not WHO decided it — the actor is recorded in the moderation log,
 * which is where accountability belongs, rather than on a wall chart.
 */

const RECENT_ACTION_LIMIT = 8;
const SUSPENSION_LIMIT = 50;

const num = (v) => Number(v ?? 0);

/**
 * Queue health.
 *
 * `oldestOpenHours` is the number that matters: a queue of forty reports where the oldest is
 * an hour old is healthy, and a queue of two where the oldest is a week old is not.
 */
async function queueHealth() {
    const row = await db.sequelize.query(
        `SELECT
           count(*) FILTER (WHERE status = 'OPEN')                              AS open,
           count(*) FILTER (WHERE status = 'TRIAGED')                           AS triaged,
           count(*) FILTER (WHERE status IN ('OPEN','TRIAGED')
                            AND severity = 'CRITICAL')                          AS critical,
           count(*) FILTER (WHERE resolved_at >= now() - interval '7 days')      AS resolved_7d,
           EXTRACT(EPOCH FROM (now() - min(created_at)
             FILTER (WHERE status IN ('OPEN','TRIAGED')))) / 3600               AS oldest_open_hours
         FROM canwemarry.reports`,
        { type: db.sequelize.QueryTypes.SELECT, plain: true },
    );

    return {
        open: num(row.open),
        triaged: num(row.triaged),
        awaiting: num(row.open) + num(row.triaged),
        critical: num(row.critical),
        resolvedLast7Days: num(row.resolved_7d),
        oldestOpenHours: row.oldest_open_hours === null ? null : Math.round(Number(row.oldest_open_hours) * 10) / 10,
    };
}

/**
 * Accounts under a suspension that is IN FORCE right now.
 *
 * The distinction matters more than it looks. `users.status` stays 'SUSPENDED' after a
 * suspension expires — nothing rewrites it, and no job sweeps it. What the authentication
 * middleware actually enforces is:
 *
 *     status = 'SUSPENDED' AND (suspended_until IS NULL OR suspended_until > now())
 *
 * so an expired suspension stops blocking access on the very next request while the column
 * still reads SUSPENDED. Reporting the column would therefore tell a moderator that somebody
 * is locked out when they are not. This mirrors the middleware exactly, and `effectiveState`
 * below says which of the two is being reported.
 */
async function suspensions() {
    const rows = await db.sequelize.query(
        `SELECT id, status, suspended_until, updated_at,
                (suspended_until IS NOT NULL AND suspended_until <= now()) AS has_expired
         FROM canwemarry.users
         WHERE status = 'SUSPENDED'
         ORDER BY suspended_until IS NULL DESC, suspended_until DESC
         LIMIT :limit`,
        { replacements: { limit: SUSPENSION_LIMIT }, type: db.sequelize.QueryTypes.SELECT },
    );

    return rows.map((r) => ({
        userId: r.id,
        // What the row says.
        storedStatus: r.status,
        // What the platform actually does about it, which is what a moderator is asking.
        effectiveState: r.has_expired ? 'EXPIRED' : 'ACTIVE',
        expiresAt: r.suspended_until,
        indefinite: r.suspended_until === null,
        appliedAt: r.updated_at,
    }));
}

/**
 * The last few decisions, as decisions.
 *
 * No actor id and no actor name. Who did what is in `moderation_actions` and reachable
 * through the moderation log, where it is attributable and reviewable; putting it on a
 * dashboard would make it a scoreboard, and a scoreboard rewards speed.
 *
 * The reason is deliberately omitted too: reasons are written about specific content and
 * often quote it.
 */
async function recentActions() {
    const rows = await db.sequelize.query(
        `SELECT action, target_type, created_at
         FROM canwemarry.moderation_actions
         ORDER BY created_at DESC
         LIMIT :limit`,
        { replacements: { limit: RECENT_ACTION_LIMIT }, type: db.sequelize.QueryTypes.SELECT },
    );
    return rows.map((r) => ({ action: r.action, targetType: r.target_type, at: r.created_at }));
}

/** Reports still waiting, grouped by what they are about. Categories, never content. */
async function awaitingByReason() {
    const rows = await db.sequelize.query(
        `SELECT reason, severity, count(*)::int AS count
         FROM canwemarry.reports
         WHERE status IN ('OPEN','TRIAGED')
         GROUP BY reason, severity
         ORDER BY count DESC, reason ASC`,
        { type: db.sequelize.QueryTypes.SELECT },
    );
    return rows.map((r) => ({ reason: r.reason, severity: r.severity, count: r.count }));
}

async function summary() {
    const [queue, suspended, actions, byReason] = await Promise.all([
        queueHealth(), suspensions(), recentActions(), awaitingByReason(),
    ]);

    return {
        queue,
        suspensions: {
            active: suspended.filter((s) => s.effectiveState === 'ACTIVE').length,
            expiredButNotCleared: suspended.filter((s) => s.effectiveState === 'EXPIRED').length,
            items: suspended,
        },
        recentActions: actions,
        awaitingByReason: byReason,
    };
}

module.exports = { summary, queueHealth, suspensions, recentActions, awaitingByReason };
