'use strict';
const db = require('../models');
const visibility = require('../domain/visibility');
const notificationService = require('./notificationService');
const { cleanBody } = require('../utils/sanitize');
const { notFound, forbidden, conflict, badRequest } = require('../utils/errors');

const STATUS = Object.freeze({
    REQUESTED: 'REQUESTED',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    WITHDRAWN: 'WITHDRAWN',
    REVOKED: 'REVOKED',
});

/**
 * Offering support is a request, never an act.
 *
 * Nobody joins a case by pressing a button: the offer is recorded as REQUESTED and the
 * case owner decides. This is the difference between a support platform and one where a
 * crowd can attach itself to a stranger's family situation.
 */
async function offer(ctx, caseId, message) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.canOfferSupport(ctx, row)) {
        throw forbidden('This case is not accepting offers of support right now.');
    }

    const existing = await db.CaseSupporter.findOne({ where: { case_id: caseId, user_id: ctx.actor.userId } });
    if (existing) {
        if (existing.status === STATUS.REVOKED) throw forbidden('You cannot offer support on this case.');
        if (existing.status === STATUS.WITHDRAWN || existing.status === STATUS.DECLINED) {
            await existing.update({ status: STATUS.REQUESTED, message: cleanBody(message), responded_at: null });
            return serialize(existing);
        }
        throw conflict('You have already offered support on this case.');
    }

    const created = await db.CaseSupporter.create({
        case_id: caseId,
        user_id: ctx.actor.userId,
        status: STATUS.REQUESTED,
        message: cleanBody(message),
    });

    await notificationService.create({
        userId: row.owner_id,
        type: 'case.support.offered',
        title: 'Someone has offered to support your case',
        body: 'A member has offered support. You can accept or decline the offer.',
        link: `/cases/${caseId}`,
    });

    return serialize(created);
}

/** The owner's decision. Accepting is what grants a supporter read access to the case. */
async function decide(ctx, caseId, supporterId, decision) {
    if (![STATUS.ACCEPTED, STATUS.DECLINED].includes(decision)) throw badRequest('A decision must be ACCEPTED or DECLINED.');

    const caseRow = await db.Case.findByPk(caseId);
    if (!caseRow) throw notFound('Case');
    if (!visibility.isOwner(ctx, caseRow)) throw forbidden('Only the person who opened a case can answer offers of support.');

    const row = await db.CaseSupporter.findOne({ where: { id: supporterId, case_id: caseId } });
    if (!row) throw notFound('Offer of support');
    if (row.status !== STATUS.REQUESTED) throw conflict('That offer has already been answered.');

    await db.sequelize.transaction(async (tx) => {
        await row.update({ status: decision, responded_at: new Date() }, { transaction: tx });
        if (decision === STATUS.ACCEPTED) {
            await caseRow.increment('supporter_count', { by: 1, transaction: tx });
        }
    });

    await notificationService.create({
        userId: row.user_id,
        type: `case.support.${decision.toLowerCase()}`,
        title: decision === STATUS.ACCEPTED ? 'Your offer of support was accepted' : 'Your offer of support was answered',
        body: decision === STATUS.ACCEPTED
            ? 'You can now see and take part in the case you offered to support.'
            : 'The case owner has chosen not to take up your offer.',
        link: `/cases/${caseId}`,
    });

    return serialize(row);
}

/** A supporter can step back at any time; so can the owner, by revoking. */
async function withdraw(ctx, caseId) {
    const row = await db.CaseSupporter.findOne({ where: { case_id: caseId, user_id: ctx.actor.userId } });
    if (!row) throw notFound('Offer of support');
    if (row.status === STATUS.WITHDRAWN) return serialize(row);

    const wasAccepted = row.status === STATUS.ACCEPTED;
    await db.sequelize.transaction(async (tx) => {
        await row.update({ status: STATUS.WITHDRAWN, responded_at: new Date() }, { transaction: tx });
        if (wasAccepted) await db.Case.decrement('supporter_count', { by: 1, where: { id: caseId }, transaction: tx });
    });
    return serialize(row);
}

async function revoke(ctx, caseId, supporterId) {
    const caseRow = await db.Case.findByPk(caseId);
    if (!caseRow) throw notFound('Case');
    const isStaff = visibility.isModerator(ctx);
    if (!visibility.isOwner(ctx, caseRow) && !isStaff) throw forbidden('Only the case owner can remove a supporter.');

    const row = await db.CaseSupporter.findOne({ where: { id: supporterId, case_id: caseId } });
    if (!row) throw notFound('Supporter');
    const wasAccepted = row.status === STATUS.ACCEPTED;

    await db.sequelize.transaction(async (tx) => {
        await row.update({ status: STATUS.REVOKED, responded_at: new Date() }, { transaction: tx });
        if (wasAccepted) await caseRow.decrement('supporter_count', { by: 1, transaction: tx });
    });
    return serialize(row);
}

async function listForCase(ctx, caseId) {
    const caseRow = await db.Case.findByPk(caseId);
    if (!caseRow) throw notFound('Case');
    const level = visibility.viewLevel(ctx, caseRow);
    if (level === visibility.VIEW_LEVEL.NONE) throw notFound('Case');

    // Pending offers are the owner's business alone; other participants see only who is
    // actually standing with the case.
    const canSeePending = visibility.isOwner(ctx, caseRow) || visibility.isModerator(ctx);
    const where = canSeePending ? { case_id: caseId } : { case_id: caseId, status: STATUS.ACCEPTED };
    if (level === visibility.VIEW_LEVEL.SUMMARY) return [];

    const rows = await db.CaseSupporter.findAll({ where, order: [['created_at', 'DESC']] });
    return rows.map(serialize);
}

const serialize = (r) => ({
    id: r.id,
    caseId: r.case_id,
    userId: r.user_id,
    status: r.status,
    message: r.message,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
});

module.exports = { offer, decide, withdraw, revoke, listForCase, STATUS };
