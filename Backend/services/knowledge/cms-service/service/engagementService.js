'use strict';
const { CmsWebsite, CmsContent, CmsContentComment, CmsContentFeedback } = require('../models');
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
};
