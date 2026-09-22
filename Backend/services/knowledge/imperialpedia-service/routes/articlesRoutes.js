'use strict';
const router = require('express').Router();
const ctrl = require('../controller/articlesController');
const reviewCtrl = require('../controller/editorialReviewController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth (not authMiddleware): these stay publicly readable, but a valid Bearer lets the
// controller resolve the caller's subscription/authorship for entitlement + privileged-status
// checks. Previously these routes had NO auth middleware at all, so req.auth was always
// undefined and the author/admin bypass logic in the controller was silently dead — this fixes
// that as a prerequisite for the premium-content gate to work.
router.get('/', optionalAuth, ctrl.listArticles);
router.post('/', authMiddleware, ctrl.createArticle);
router.get('/:id', optionalAuth, ctrl.getArticle);
router.patch('/:id', authMiddleware, ctrl.updateArticle);
router.delete('/:id', authMiddleware, ctrl.deleteArticle);
router.post('/:id/publish', authMiddleware, ctrl.publishArticle);
router.post('/:id/like', authMiddleware, ctrl.likeArticle);

// PROMPT 5 — Human-Vetted Publishing Workflow (editorialReviewController.js). Article-scoped,
// not under /ai — this is an editorial approval action, not a content-analysis call.
router.get('/:id/editorial-review', authMiddleware, reviewCtrl.getReviewState);
router.get('/:id/editorial-review/history', authMiddleware, reviewCtrl.getReviewHistory);
router.post('/:id/editorial-review/approve', authMiddleware, reviewCtrl.approveReview);

module.exports = router;
