'use strict';
const { CmsWebsite, CmsContent, CmsContentComment, CmsContentFeedback, CmsContentPoll, CmsPollVote } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

// Deliberately not sharing publicService.js's website cache -- comment/feedback
// writes are low-volume relative to content reads, and a stale cached website
// row here would risk writing an engagement row against the wrong (deactivated)
// website for up to WEBSITE_CACHE_TTL_MS.
async function _resolveContent(websiteSlug, slug) {
    const website = await CmsWebsite.findOne({ where: { slug: websiteSlug, status: 'active' }, attributes: ['id'] });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);
    const content = await CmsContent.findOne({
        where: { websiteId: website.id, slug, status: 'published', visibility: 'public' },
        attributes: ['id'],
    });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);
    return { websiteId: website.id, contentId: content.id };
}

async function listComments(websiteSlug, slug) {
    const { contentId } = await _resolveContent(websiteSlug, slug);
    const rows = await CmsContentComment.findAll({
        where: { contentId, status: 'approved' },
        attributes: ['id', 'authorName', 'body', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 200,
    });
    return rows.map((r) => r.toJSON());
}

async function submitComment(websiteSlug, slug, { authorName, authorEmail, body }) {
    const { websiteId, contentId } = await _resolveContent(websiteSlug, slug);
    const comment = await CmsContentComment.create({ websiteId, contentId, authorName, authorEmail, body, status: 'pending' });
    return { id: comment.id, status: comment.status };
}

async function getFeedbackSummary(websiteSlug, slug) {
    const { contentId } = await _resolveContent(websiteSlug, slug);
    const [helpful, notHelpful] = await Promise.all([
        CmsContentFeedback.count({ where: { contentId, vote: 'helpful' } }),
        CmsContentFeedback.count({ where: { contentId, vote: 'not_helpful' } }),
    ]);
    return { helpful, notHelpful };
}

async function submitFeedback(websiteSlug, slug, { vote, voterToken }) {
    const { websiteId, contentId } = await _resolveContent(websiteSlug, slug);
    try {
        await CmsContentFeedback.create({ websiteId, contentId, vote, voterToken });
    } catch (err) {
        // Unique (content_id, voter_token) violation -- this browser already voted.
        // The caller just wants the current summary either way, not an error.
        if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }
    return getFeedbackSummary(websiteSlug, slug);
}

async function _tallyPoll(poll) {
    const rows = await CmsPollVote.findAll({
        where: { pollId: poll.id },
        attributes: ['optionIndex'],
        raw: true,
    });
    const counts = (poll.options || []).map(() => 0);
    for (const row of rows) {
        if (counts[row.optionIndex] !== undefined) counts[row.optionIndex] += 1;
    }
    return {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        counts,
        total: rows.length,
    };
}

// Returns null (not an error) when the article has no poll -- most articles won't.
async function getPoll(websiteSlug, slug) {
    const { contentId } = await _resolveContent(websiteSlug, slug);
    const poll = await CmsContentPoll.findOne({ where: { contentId, status: 'active' } });
    if (!poll) return null;
    return _tallyPoll(poll);
}

async function submitPollVote(websiteSlug, slug, { optionIndex, voterToken }) {
    const { contentId } = await _resolveContent(websiteSlug, slug);
    const poll = await CmsContentPoll.findOne({ where: { contentId, status: 'active' } });
    if (!poll) throw new AppError('NOT_FOUND', 'Poll not found', 404);
    if (optionIndex < 0 || optionIndex >= (poll.options || []).length) {
        throw new AppError('VALIDATION_ERROR', 'Invalid poll option', 400);
    }
    try {
        await CmsPollVote.create({ pollId: poll.id, optionIndex, voterToken });
    } catch (err) {
        // Unique (poll_id, voter_token) violation -- this browser already voted.
        if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }
    return _tallyPoll(poll);
}

// ── Admin poll authoring (cms_contributor+, website-scoped) ──────────────────
// A content item has at most one poll (unique content_id — see migration
// 20260033), so "create" and "edit" are the same upsert from the editor's
// point of view: save whatever question/options are currently in the panel.

async function getPollAdmin(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);
    const poll = await CmsContentPoll.findOne({ where: { contentId } });
    return poll ? poll.toJSON() : null;
}

async function upsertPoll(websiteId, contentId, { question, options }) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const existing = await CmsContentPoll.findOne({ where: { contentId } });
    if (existing) {
        existing.question = question;
        existing.options = options;
        await existing.save();
        return existing.toJSON();
    }
    const poll = await CmsContentPoll.create({ websiteId, contentId, question, options, status: 'active' });
    return poll.toJSON();
}

async function deletePoll(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);
    await CmsContentPoll.destroy({ where: { contentId } });
}

// ── Admin moderation (cms_reviewer+, website-scoped) ─────────────────────────

async function listPendingComments(websiteId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await CmsContentComment.findAndCountAll({
        where: { websiteId, status: 'pending' },
        include: [{ model: CmsContent, as: 'content', attributes: ['id', 'title', 'slug'] }],
        order: [['createdAt', 'ASC']],
        limit, offset,
    });
    return buildPaginated(rows, count, { page, limit });
}

async function moderateComment(websiteId, commentId, status, reviewerId) {
    const comment = await CmsContentComment.findOne({ where: { id: commentId, websiteId } });
    if (!comment) throw new AppError('NOT_FOUND', 'Comment not found', 404);
    comment.status = status;
    comment.reviewedBy = reviewerId || null;
    comment.reviewedAt = new Date();
    await comment.save();
    return comment.toJSON();
}

module.exports = {
    listComments,
    submitComment,
    getFeedbackSummary,
    submitFeedback,
    listPendingComments,
    moderateComment,
    getPoll,
    submitPollVote,
    getPollAdmin,
    upsertPoll,
    deletePoll,
};
