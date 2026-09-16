'use strict';
const db = require('../models');
const notificationService = require('./notificationService');
const { cleanBody } = require('../utils/sanitize');
const { notFound, conflict } = require('../utils/errors');

const STATUS = Object.freeze({ OPEN: 'OPEN', TRIAGED: 'TRIAGED', ACTIONED: 'ACTIONED', DISMISSED: 'DISMISSED' });

// Reports that describe a risk to someone's safety enter the queue above the rest, without
// waiting for a human to triage them first.
const URGENT_REASONS = Object.freeze(['THREAT_OR_VIOLENCE', 'SELF_HARM_RISK', 'COERCION']);

async function create(ctx, { targetType, targetId, reason, details }) {
    const existing = await db.Report.findOne({
        where: { reporter_id: ctx.actor.userId, target_type: targetType, target_id: targetId },
    });
    if (existing) throw conflict('You have already reported this. A moderator is reviewing it.');

    const row = await db.Report.create({
        reporter_id: ctx.actor.userId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: cleanBody(details),
        severity: URGENT_REASONS.includes(reason) ? 'CRITICAL' : 'NORMAL',
    });
    return serialize(row);
}

/**
 * The moderation queue. Severity first, then age, so a threat reported a minute ago is
 * seen before a spam report from yesterday.
 */
const SEVERITY_RANK = db.sequelize.literal(
    `CASE severity WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END`,
);

/**
 * Sorts a moderator can choose between.
 *
 * `triage` is the default and stays the default: severity first, then oldest, so a threat
 * reported a minute ago is seen before yesterday's spam. The others exist because reviewing
 * a queue and auditing one are different jobs — `newest` answers "what just came in",
 * `oldest` answers "what has been waiting", and neither should quietly replace triage order.
 */
const SORTS = {
    triage: [[SEVERITY_RANK, 'ASC'], ['created_at', 'ASC']],
    oldest: [['created_at', 'ASC']],
    newest: [['created_at', 'DESC']],
    updated: [['updated_at', 'DESC']],
};

async function list({ page, pageSize, status, severity, reason, targetType, unresolved, sort }) {
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (reason) where.reason = reason;
    if (targetType) where.target_type = targetType;
    // "Everything still waiting on a decision", which is two statuses rather than one and is
    // the question a moderator actually asks.
    if (unresolved) where.status = { [db.Op.in]: [STATUS.OPEN, STATUS.TRIAGED] };

    const { rows, count } = await db.Report.findAndCountAll({
        where,
        order: SORTS[sort] || SORTS.triage,
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

async function get(id) {
    const row = await db.Report.findByPk(id);
    if (!row) throw notFound('Report');

    // How many separate people raised this, without saying who any of them are. One account
    // cannot report the same thing twice, so this is a count of people rather than of clicks.
    const reportsOnTarget = await db.Report.count({
        where: { target_type: row.target_type, target_id: row.target_id },
    });

    return { ...serialize(row), reportsOnTarget };
}

/** Reports the caller filed. Reporters see their own outcomes; they never see the queue. */
async function listMine(ctx, { page, pageSize }) {
    const { rows, count } = await db.Report.findAndCountAll({
        where: { reporter_id: ctx.actor.userId },
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serializeForReporter), total: count };
}

async function review(ctx, id, { status, severity, resolutionNote }) {
    const row = await db.Report.findByPk(id);
    if (!row) throw notFound('Report');
    await row.update({
        status,
        ...(severity ? { severity } : {}),
        resolution_note: cleanBody(resolutionNote),
        assigned_to: ctx.actor.userId,
        resolved_at: [STATUS.ACTIONED, STATUS.DISMISSED].includes(status) ? new Date() : null,
    });

    // The reporter asked; they are entitled to know it was looked at. Not what was decided,
    // and not by whom — that concerns somebody else's account.
    if ([STATUS.ACTIONED, STATUS.DISMISSED].includes(status) && row.reporter_id) {
        await notificationService.notify(row.reporter_id, notificationService.EVENT.reportResolved(), ctx.actor.userId);
    }

    return serialize(row);
}

/**
 * A report, as a moderator sees it.
 *
 * The reporter is NOT named. Deciding whether content breaks the rules is a question about
 * the content, and knowing who complained can only colour that judgement — or, if a
 * moderator later becomes involved in the same community, expose the person who spoke up.
 * Nothing in the product needed the id: it was being sent because it was in the row.
 *
 * Reporting the same thing twice is already impossible for one account (`create` refuses
 * it), so the volume signal a moderator might want is "how many people flagged this", which
 * `get` supplies as a count.
 */
const serialize = (r) => ({
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    details: r.details,
    severity: r.severity,
    status: r.status,
    assignedTo: r.assigned_to,
    resolutionNote: r.resolution_note,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
});

// The reporter sees that their report was handled, not who handled it — moderator identity
// is withheld from the person whose report may have gone against someone.
const serializeForReporter = (r) => ({
    id: r.id,
    targetType: r.target_type,
    reason: r.reason,
    status: r.status,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
});

module.exports = { create, list, get, listMine, review, STATUS, URGENT_REASONS, SORTS };
