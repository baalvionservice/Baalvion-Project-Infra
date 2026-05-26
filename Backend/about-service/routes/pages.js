'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/pageController');

router.get('/', ctrl.listPages);
router.post('/', authMiddleware, ctrl.createPage);
router.get('/id/:id', authMiddleware, ctrl.getPageById);
router.get('/:slug', ctrl.getPageBySlug);
router.patch('/:id', authMiddleware, ctrl.updatePage);
router.delete('/:id', authMiddleware, ctrl.deletePage);
router.post('/:id/publish', authMiddleware, ctrl.publishPage);

module.exports = router;
