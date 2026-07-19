'use strict';
const router = require('express').Router();
const ctrl = require('../controller/articlesController');
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

module.exports = router;
