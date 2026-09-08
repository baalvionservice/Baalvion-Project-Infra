'use strict';
const db = require('../models');
const visibility = require('../domain/visibility');
const notificationService = require('./notificationService');
const { cleanBody } = require('../utils/sanitize');
const { notFound, forbidden } = require('../utils/errors');

/**
 * Updates are readable by anyone who can read the case at all — including a stranger on a
 * public case, because an update is the owner's own published words, the same as the
 * summary. Only the owner can write one.
 */
async function list(ctx, caseId, { page, pageSize }) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');

    const { rows, count } = await db.CaseUpdate.findAndCountAll({
        where: { case_id: caseId },
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

async function create(ctx, caseId, body) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.isOwner(ctx, row)) throw forbidden('Only the person who opened a case can post an update.');
    if (row.is_locked) throw forbidden('This case is locked.');

    const created = await db.CaseUpdate.create({
        case_id: caseId,
        author_id: ctx.actor.userId,
        body: cleanBody(body),
    });

    // Tell the people who chose to stand with this case, and nobody else.
    const supporters = await db.CaseSupporter.findAll({
        where: { case_id: caseId, status: 'ACCEPTED' },
        attributes: ['user_id'],
        raw: true,
    });
    await Promise.all(supporters.map((s) => notificationService.create({
        userId: s.user_id,
        type: 'case.update.posted',
        title: 'A case you support has an update',
        body: null,
        link: `/cases/${caseId}`,
    })));

    return serialize(created);
}

async function remove(ctx, caseId, updateId) {
    const row = await db.CaseUpdate.findOne({ where: { id: updateId, case_id: caseId } });
    if (!row) throw notFound('Update');
    if (row.author_id !== ctx.actor.userId) throw forbidden('Only the author can delete an update.');
    await row.destroy();
    return { id: updateId, deleted: true };
}

const serialize = (u) => ({
    id: u.id,
    caseId: u.case_id,
    authorId: u.author_id,
    body: u.body,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
});

module.exports = { list, create, remove };
