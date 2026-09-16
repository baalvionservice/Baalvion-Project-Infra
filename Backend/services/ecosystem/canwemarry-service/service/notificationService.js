'use strict';
const db = require('../models');
const { notFound } = require('../utils/errors');

/**
 * In-app notifications only.
 *
 * Delivery to email or push is deliberately out of scope here: an email arriving in a
 * shared family inbox is exactly the disclosure risk this product exists around, so any
 * outbound channel is an explicit, opt-in decision rather than something the notification
 * layer does by default.
 */
async function create({ userId, type, title, body = null, link = null }) {
    return db.Notification.create({ user_id: userId, type, title, body, link });
}

/**
 * Every notification the product emits, with its wording fixed here rather than at each
 * call site.
 *
 * Two rules govern the copy, and both come from where these are read. A notification list
 * is often the first thing visible when a phone is unlocked, and this platform's users
 * frequently share devices with the family the case is about.
 *
 *   1. No notification names a person, a case, or quotes anything written. "A case you
 *      support has an update" is useful; the case's title is not, and would be readable by
 *      anyone glancing at the screen.
 *   2. Nothing is emitted merely to pull somebody back. There is no notification for a
 *      reaction, and none for a change the recipient made themselves.
 */
const EVENT = {
    // ── Cases ────────────────────────────────────────────────────────────────
    caseCommented: (caseId) => ({
        type: 'case.comment.created',
        title: 'Someone replied on your case',
        body: 'There is a new comment on a case you opened.',
        link: `/cases/${caseId}`,
    }),
    commentReplied: (caseId) => ({
        type: 'case.comment.replied',
        title: 'Someone replied to you',
        body: 'A member has replied to one of your comments.',
        link: `/cases/${caseId}`,
    }),

    // ── Communities ──────────────────────────────────────────────────────────
    postCommented: (slugOrId, postId) => ({
        type: 'community.post.commented',
        title: 'Someone replied to your post',
        body: 'There is a new reply to a discussion you started.',
        link: `/community/${slugOrId}/posts/${postId}`,
    }),
    joinApproved: (slug) => ({
        type: 'community.join.approved',
        title: 'Your request to join was accepted',
        body: 'You can now take part in that community.',
        link: `/community/${slug}`,
    }),

    // ── Safety ───────────────────────────────────────────────────────────────
    reportResolved: () => ({
        type: 'report.resolved',
        title: 'A report you sent has been reviewed',
        // Deliberately no outcome and no moderator: the reporter sees the status on their
        // own report page, and the moderator's reasoning is not theirs to read.
        body: 'A moderator has looked at something you reported.',
        link: '/me/reports',
    }),
    // ── Standing ─────────────────────────────────────────────────────────────
    roleRequestApproved: (role) => ({
        type: 'role.request.approved',
        title: 'Your request was accepted',
        body: `You can now take part as a ${role.toLowerCase()}.`,
        link: '/settings',
    }),
    roleRequestDeclined: () => ({
        type: 'role.request.declined',
        title: 'A moderator has answered your request',
        // The written reason lives on the request itself rather than in the notification,
        // which may be read over somebody's shoulder on a shared phone.
        body: 'There is a reply to the request you sent. You can read it in your settings.',
        link: '/settings',
    }),

    contentModerated: (action) => ({
        type: 'moderation.content.actioned',
        title: 'A moderator has acted on something you wrote',
        // Naming the action without naming the content: enough to know to go and look.
        body: `A moderator has taken action (${action.toLowerCase().replace(/_/g, ' ')}) on something you posted. You can see the reason on the item itself.`,
        link: '/notifications',
    }),
};

/** Fire an event for one recipient, skipping the case where they are their own audience. */
async function notify(userId, event, actorId = null) {
    if (!userId) return null;
    // Nobody needs telling about a thing they just did themselves.
    if (actorId && String(userId) === String(actorId)) return null;
    return create({ userId, ...event });
}

async function list(ctx, { page, pageSize, unreadOnly }) {
    const where = { user_id: ctx.actor.userId };
    if (unreadOnly) where.read_at = null;

    const { rows, count } = await db.Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

const unreadCount = (ctx) => db.Notification.count({ where: { user_id: ctx.actor.userId, read_at: null } });

/** Scoped by user_id in the WHERE clause, so an id belonging to someone else simply misses. */
async function markRead(ctx, id) {
    const row = await db.Notification.findOne({ where: { id, user_id: ctx.actor.userId } });
    if (!row) throw notFound('Notification');
    if (!row.read_at) await row.update({ read_at: new Date() });
    return serialize(row);
}

async function markAllRead(ctx) {
    const [updated] = await db.Notification.update(
        { read_at: new Date() },
        { where: { user_id: ctx.actor.userId, read_at: null } },
    );
    return { updated };
}

const serialize = (n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.read_at,
    createdAt: n.created_at,
});

module.exports = { create, notify, EVENT, list, unreadCount, markRead, markAllRead };
