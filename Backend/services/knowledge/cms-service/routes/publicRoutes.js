'use strict';
const { Router } = require('express');
const ctrl = require('../controller/publicController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { submitCommentSchema, submitFeedbackSchema } = require('../validators/engagementSchemas');

const router = Router();

// Public read-only APIs — no authentication REQUIRED, but content/list routes accept an
// optional Bearer so the premium-content gate (service/publicService.js + entitlementClient.js)
// knows who's asking. Previously these had zero auth middleware, so req.auth was always
// undefined — same prerequisite gap fixed for imperialpedia-service's article routes.
// /public/:websiteSlug/...
router.get('/:websiteSlug', ctrl.getWebsiteInfo);
router.get('/:websiteSlug/content', optionalAuth, ctrl.listContent);
router.get('/:websiteSlug/content/:slug', optionalAuth, ctrl.getContent);
// Token-gated draft preview for the admin CMS live-preview iframe — see contentController.getPreviewToken.
router.get('/:websiteSlug/content/:slug/preview', ctrl.getPreviewContent);
router.get('/:websiteSlug/categories/:categorySlug', ctrl.getCategory);
router.get('/:websiteSlug/authors', ctrl.listAuthors);
router.get('/:websiteSlug/authors/:slug', ctrl.getAuthor);

// Reader engagement -- approved-only comment list/submit (held for moderation,
// see controller/commentModerationController.js) and "was this helpful?" voting.
router.get('/:websiteSlug/content/:slug/comments', ctrl.listComments);
router.post('/:websiteSlug/content/:slug/comments', validate(submitCommentSchema), ctrl.submitComment);
router.get('/:websiteSlug/content/:slug/feedback', ctrl.getFeedback);
router.post('/:websiteSlug/content/:slug/feedback', validate(submitFeedbackSchema), ctrl.submitFeedback);

module.exports = router;
