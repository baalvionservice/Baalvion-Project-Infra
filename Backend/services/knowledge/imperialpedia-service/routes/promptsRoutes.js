'use strict';
const router = require('express').Router();
const ctrl = require('../controller/promptsController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth so a staff bearer can pass ?status=all (moderation); public callers get
// active-only. Mutations require authMiddleware + the isPrivilegedCaller check inside the
// controller — editorial-only, same as affiliateRoutes.js.
router.get('/', optionalAuth, ctrl.listPrompts);
router.post('/', authMiddleware, ctrl.createPrompt);
// Must be registered before /:slug so 'id' isn't captured as a slug.
router.get('/id/:id', authMiddleware, ctrl.getPromptById);
router.patch('/:id', authMiddleware, ctrl.updatePrompt);
router.delete('/:id', authMiddleware, ctrl.deletePrompt);
router.post('/:slug/copy', ctrl.recordPromptCopy);
router.get('/:slug', optionalAuth, ctrl.getPromptBySlug);

module.exports = router;
