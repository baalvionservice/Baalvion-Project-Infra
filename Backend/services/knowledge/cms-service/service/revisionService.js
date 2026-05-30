'use strict';
const { CmsContent, CmsContentRevision } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listRevisions(websiteId, contentId, query = {}) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await CmsContentRevision.findAndCountAll({
        where: { contentId },
        order: [['revisionNumber', 'DESC']],
        limit, offset,
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getRevision(websiteId, contentId, revisionId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const revision = await CmsContentRevision.findOne({ where: { id: revisionId, contentId } });
    if (!revision) throw new AppError('NOT_FOUND', 'Revision not found', 404);

    return revision.toJSON();
}

async function createRevision(contentId, userId, changeNote = null, transaction = null) {
    // When called from inside a workflow transaction, EVERY query here must run on that
    // same transaction. Otherwise content.increment() below opens a second connection and
    // UPDATEs the content row that the outer (uncommitted) transaction already locked →
    // self-deadlock → pool timeout → the whole transition rolls back.
    const content = await CmsContent.findOne({ where: { id: contentId }, transaction });
    if (!content) return;

    // Derive the next revision number from the actual max on record rather than the
    // denormalized revisionCount — the counter can drift from seeds/partial failures
    // and a stale value collides with the (content_id, revision_number) unique index.
    const lastNumber = (await CmsContentRevision.max('revisionNumber', { where: { contentId }, transaction })) || 0;
    const nextNumber = Number(lastNumber) + 1;
    await CmsContentRevision.create({
        contentId,
        revisionNumber: nextNumber,
        title: content.title,
        snapshot: {
            title: content.title,
            slug: content.slug,
            excerpt: content.excerpt,
            contentBlocks: content.contentBlocks,
            tagIds: content.tagIds,
            seoMetadata: content.seoMetadata,
            customFields: content.customFields,
            status: content.status,
        },
        createdBy: userId,
        changeNote,
    }, { transaction });

    await content.increment('revisionCount', { transaction });
}

async function restoreRevision(websiteId, contentId, revisionId, userId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const revision = await CmsContentRevision.findOne({ where: { id: revisionId, contentId } });
    if (!revision) throw new AppError('NOT_FOUND', 'Revision not found', 404);

    if (['published', 'archived'].includes(content.status)) {
        throw new AppError('FORBIDDEN', 'Cannot restore a revision for published/archived content', 403);
    }

    const snap = revision.snapshot;
    await content.update({
        title: snap.title,
        slug: snap.slug,
        excerpt: snap.excerpt,
        contentBlocks: snap.contentBlocks,
        tagIds: snap.tagIds,
        seoMetadata: snap.seoMetadata,
        customFields: snap.customFields,
        lastEditedBy: userId,
    });

    return content.toJSON();
}

module.exports = { listRevisions, getRevision, createRevision, restoreRevision };
