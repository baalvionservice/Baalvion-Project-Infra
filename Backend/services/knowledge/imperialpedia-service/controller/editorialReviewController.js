'use strict';
/**
 * PROMPT 5 — Human-Vetted Publishing Workflow.
 *
 * Endpoints live under /articles/:id/editorial-review — article-scoped, not /ai, because this
 * is an editorial approval action on a specific article, not a content-analysis call (compare
 * aiController.js, which stays untouched). Reuses editorialAuditService's contentFingerprint()
 * and HUMAN_REVIEW_CHECKLIST and editorialReviewService's validation — no second checklist, no
 * second fingerprint algorithm, no second audit computation.
 */
const db = require('../models');
const { contentFingerprint } = require('../service/editorialAuditService');
const reviewService = require('../service/editorialReviewService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const PRIVILEGED_ROLES = ['admin', 'owner', 'super_admin'];
const isPrivilegedCaller = (req) => ((req.auth && req.auth.roles) || []).some((r) => PRIVILEGED_ROLES.includes(r));

// Same authorization bar as updateArticle/publishArticle (articlesController.js) — the person
// approving must be the article's own author or a privileged role. No separate reviewer role is
// invented here: the repo currently has one trusted admin tier for this service (spec §12), so
// the requirement collapses to "the approver is authenticated and already permitted to edit this
// article".
function assertCanReview(req, article) {
    const isOwnerOrAdmin = article.author_id === req.user.id || isPrivilegedCaller(req);
    if (!isOwnerOrAdmin) throw new AppError('FORBIDDEN', 'Not authorized to review this article', 403);
}

function serializeReview(review) {
    if (!review) return null;
    return {
        id: review.id,
        reviewerUserId: review.reviewer_user_id,
        reviewedFingerprint: review.reviewed_fingerprint,
        auditStatusAtReview: review.audit_status_at_review,
        criticalCount: review.critical_count,
        warningCount: review.warning_count,
        suggestionCount: review.suggestion_count,
        checklistState: review.checklist_state,
        reviewerNote: review.reviewer_note,
        acknowledgedCritical: review.acknowledged_critical,
        approvedForPublication: review.approved_for_publication,
        approvedAt: review.approved_at,
        createdAt: review.created_at,
    };
}

async function loadArticleOr404(id) {
    const article = await db.Article.findByPk(parseInt(id, 10));
    if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
    return article;
}

// GET /articles/:id/editorial-review — current review status + latest review record (if any).
// Never returns full article content/body — only the fingerprint needed to explain staleness.
const getReviewState = async (req, res, next) => {
    try {
        const article = await loadArticleOr404(req.params.id);
        assertCanReview(req, article);

        const latestReview = await db.ArticleEditorialReview.findOne({
            where: { article_id: article.id },
            order: [['created_at', 'DESC']],
        });

        const currentFingerprint = contentFingerprint(article.title, article.content);
        const status = reviewService.deriveReviewStatus(latestReview, currentFingerprint);

        return sendSuccess(req, res, {
            status,
            currentFingerprint,
            review: serializeReview(latestReview),
        });
    } catch (err) { return next(err); }
};

// GET /articles/:id/editorial-review/history — full review history (spec §10), most recent first.
const getReviewHistory = async (req, res, next) => {
    try {
        const article = await loadArticleOr404(req.params.id);
        assertCanReview(req, article);

        const reviews = await db.ArticleEditorialReview.findAll({
            where: { article_id: article.id },
            order: [['created_at', 'DESC']],
            limit: 50,
        });

        return sendSuccess(req, res, { history: reviews.map(serializeReview) });
    } catch (err) { return next(err); }
};

// POST /articles/:id/editorial-review/approve — the one and only approval action. Never
// publishes by itself (spec §19/§20/§35) — publishArticle (articlesController.js) is the only
// place status ever becomes 'published', and it now requires a matching APPROVED review.
const approveReview = async (req, res, next) => {
    try {
        const article = await loadArticleOr404(req.params.id);
        assertCanReview(req, article);

        const validated = reviewService.validateApprovalInput(req.body);
        if (!validated.ok) return next(new AppError('VALIDATION_ERROR', validated.error, 400));
        const input = validated.value;

        // The ONLY check that actually protects against a stale/edited-since-audit approval:
        // the fingerprint the client says it reviewed must match what's ACTUALLY in the DB right
        // now, never what the client claims the article currently looks like (spec §8/§21).
        const currentFingerprint = contentFingerprint(article.title, article.content);
        if (input.reviewedFingerprint !== currentFingerprint) {
            return next(new AppError(
                'STALE_REVIEW',
                'Article changed after review. Please run the editorial audit and complete human review again.',
                409
            ));
        }

        // Reviewer identity ALWAYS comes from the authenticated request — never from the body
        // (spec §11/§28: "client cannot fabricate reviewer identity").
        const review = await db.ArticleEditorialReview.create({
            article_id: article.id,
            reviewer_user_id: req.user.id,
            reviewed_fingerprint: input.reviewedFingerprint,
            audit_status_at_review: input.auditStatusAtReview,
            critical_count: input.criticalCount,
            warning_count: input.warningCount,
            suggestion_count: input.suggestionCount,
            checklist_state: input.checklistState,
            reviewer_note: input.reviewerNote,
            acknowledged_critical: input.acknowledgedCritical,
            approved_for_publication: true,
            approved_at: new Date(),
        });

        return sendSuccess(req, res, {
            status: 'APPROVED',
            currentFingerprint,
            review: serializeReview(review),
        }, 201);
    } catch (err) { return next(err); }
};

module.exports = { getReviewState, getReviewHistory, approveReview };
