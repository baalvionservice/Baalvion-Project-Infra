'use strict';
// Bug-bounty program: admin-managed tasks, recorded rules acceptance, vulnerability reports with
// an admin review trail, and a private hunter<->admin message thread. Payouts are NOT automated:
// "paid" is a status an admin sets after paying out-of-band, with a note saying how.
const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const events = require('./notifyEvents');

const RULES_VERSION = '1';
const REPORTS_PER_DAY = 10;
const THREAD_LIMIT = 200;
const PAGE_MAX = 200;

const toTask = (r) => ({
    id: r.id, title: r.title, target: r.target, difficulty: r.difficulty, rewardLabel: r.reward_label,
    description: r.description, rules: r.rules, status: r.status, createdAt: r.createdAt,
});
const toReport = (r, { admin = false } = {}) => ({
    id: r.id, taskId: r.task_id, title: r.title, description: r.description, evidenceLinks: r.evidence_links,
    status: r.status, reviewerNote: r.reviewer_note, rewardNote: r.reward_note, createdAt: r.createdAt,
    reviewedAt: r.reviewed_at,
    payout: r.paid_at ? {
        method: r.payout_method, amount: Number(r.payout_amount), currency: r.payout_currency,
        reference: r.payout_reference, paidAt: r.paid_at,
    } : null,
    task: r.task ? { id: r.task.id, title: r.task.title } : undefined,
    ...(admin ? { userId: r.user_id, reporter: r.reporter_label } : {}),
});
const toMessage = (r) => ({
    id: r.id, fromAdmin: r.from_admin, content: r.content, createdAt: r.createdAt, senderLabel: r.sender_label,
});

// ── Hunter ───────────────────────────────────────────────────────────────────
async function getStatus(userId) {
    const p = await db.BountyParticipant.findOne({ where: { user_id: userId } });
    return { accepted: !!p, rulesVersion: RULES_VERSION, acceptedAt: p ? p.accepted_at : null };
}

async function acceptRules(userId) {
    await db.BountyParticipant.findOrCreate({ where: { user_id: userId }, defaults: { user_id: userId, rules_version: RULES_VERSION } });
    return getStatus(userId);
}

async function listOpenTasks() {
    const rows = await db.BountyTask.findAll({ where: { status: 'open' }, order: [['created_at', 'ASC']] });
    return rows.map(toTask);
}

async function submitReport(userId, label, data) {
    const participant = await db.BountyParticipant.findOne({ where: { user_id: userId } });
    if (!participant) throw new AppError('RULES_NOT_ACCEPTED', 'Accept the program rules before reporting', 403);
    const task = await db.BountyTask.findByPk(data.taskId);
    if (!task || task.status !== 'open') throw new AppError('NOT_FOUND', 'Task not found or closed', 404);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.BountyReport.count({ where: { user_id: userId, created_at: { [Op.gte]: since } } });
    if (recent >= REPORTS_PER_DAY) throw new AppError('RATE_LIMITED', 'Daily report limit reached', 429);
    const row = await db.BountyReport.create({
        task_id: task.id, user_id: userId, reporter_label: label, title: data.title,
        description: data.description, evidence_links: data.evidenceLinks,
    });
    events.bountyReportSubmitted(row, task);
    return toReport(row);
}

async function listMyReports(userId) {
    const rows = await db.BountyReport.findAll({
        where: { user_id: userId }, include: [{ model: db.BountyTask, as: 'task', attributes: ['id', 'title'] }],
        order: [['created_at', 'DESC']], limit: 100,
    });
    return rows.map((r) => toReport(r));
}

// ── Thread ───────────────────────────────────────────────────────────────────
async function getThread(threadUserId, { viewerIsAdmin, after }) {
    const where = { thread_user_id: threadUserId };
    if (after) {
        const d = new Date(after);
        if (!Number.isNaN(d.getTime())) where.created_at = { [Op.gt]: d };
    }
    const rows = await db.BountyMessage.findAll({ where, order: [['created_at', 'DESC']], limit: THREAD_LIMIT });
    // The viewer has now seen everything the other side wrote.
    await db.BountyMessage.update(
        { read_by_recipient: true },
        { where: { thread_user_id: threadUserId, from_admin: !viewerIsAdmin, read_by_recipient: false } },
    );
    return rows.reverse().map(toMessage);
}

async function postMessage(threadUserId, sender, content) {
    if (!sender.isAdmin) {
        const p = await db.BountyParticipant.findOne({ where: { user_id: sender.id } });
        if (!p) throw new AppError('RULES_NOT_ACCEPTED', 'Accept the program rules first', 403);
    }
    const row = await db.BountyMessage.create({
        thread_user_id: threadUserId, sender_id: sender.id, from_admin: sender.isAdmin,
        sender_label: sender.isAdmin ? 'Admin' : sender.label, content,
    });
    if (sender.isAdmin) events.bountyAdminReply(threadUserId, row.id);
    else events.bountyHunterMessage(row.id, sender.label);
    return toMessage(row);
}

async function unreadForHunter(userId) {
    return db.BountyMessage.count({ where: { thread_user_id: userId, from_admin: true, read_by_recipient: false } });
}

// ── Admin ────────────────────────────────────────────────────────────────────
const taskColumns = (d) => ({
    title: d.title, target: d.target, difficulty: d.difficulty, reward_label: d.rewardLabel,
    description: d.description, rules: d.rules, status: d.status,
});
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const adminListTasks = async () => (await db.BountyTask.findAll({ order: [['created_at', 'ASC']] })).map(toTask);
const adminCreateTask = async (d) => toTask(await db.BountyTask.create(defined(taskColumns(d))));
async function adminUpdateTask(id, d) {
    const row = await db.BountyTask.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Task not found', 404);
    await row.update(defined(taskColumns(d)));
    return toTask(row);
}

async function adminListReports({ status, limit, offset }) {
    const { rows, count } = await db.BountyReport.findAndCountAll({
        where: status ? { status } : {}, include: [{ model: db.BountyTask, as: 'task', attributes: ['id', 'title'] }],
        order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toReport(r, { admin: true })), total: count };
}

async function adminReviewReport(id, adminId, d) {
    const row = await db.BountyReport.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Report not found', 404);
    if (row.status === 'paid') throw new AppError('CONFLICT', 'This report is already paid; the payout record is final', 409);
    await row.update({
        status: d.status, reviewer_note: d.reviewerNote ?? row.reviewer_note, reward_note: d.rewardNote ?? row.reward_note,
        reviewed_by: adminId, reviewed_at: new Date(),
        ...(d.status === 'paid' ? {
            payout_method: d.payout.method, payout_amount: d.payout.amount, payout_currency: d.payout.currency,
            payout_reference: d.payout.reference, paid_at: new Date(), paid_by: adminId,
        } : {}),
    });
    events.bountyReportReviewed(row);
    return toReport(row, { admin: true });
}

async function adminListThreads() {
    return db.sequelize.query(
        `SELECT thread_user_id AS "userId",
                MAX(created_at) AS "lastAt",
                (ARRAY_AGG(content ORDER BY created_at DESC))[1] AS "lastMessage",
                (ARRAY_AGG(sender_label ORDER BY created_at DESC) FILTER (WHERE from_admin = false))[1] AS "hunter",
                COUNT(*) FILTER (WHERE from_admin = false AND read_by_recipient = false)::int AS unread
           FROM community.bounty_messages
          GROUP BY thread_user_id
          ORDER BY MAX(created_at) DESC
          LIMIT 200`,
        { type: QueryTypes.SELECT },
    );
}

module.exports = {
    getStatus, acceptRules, listOpenTasks, submitReport, listMyReports,
    getThread, postMessage, unreadForHunter,
    adminListTasks, adminCreateTask, adminUpdateTask, adminListReports, adminReviewReport, adminListThreads,
};
