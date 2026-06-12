'use strict';
const router = require('express').Router();
const ctrl = require('../controller/glossaryController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Public read (optionalAuth lets an admin bearer preview unpublished terms / see all statuses)
router.get('/', optionalAuth, ctrl.listTerms);
router.get('/term/:slug', optionalAuth, ctrl.getTermBySlug);
router.get('/term/:slug/tooltip', ctrl.getTooltip);

// Admin write
router.get('/:id', authMiddleware, ctrl.getTermById);
router.post('/', authMiddleware, ctrl.createTerm);
router.patch('/:id', authMiddleware, ctrl.updateTerm);
router.delete('/:id', authMiddleware, ctrl.deleteTerm);

module.exports = router;
