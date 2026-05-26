'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/newsController');

router.get('/', ctrl.listNewsPosts);
router.post('/', authMiddleware, ctrl.createNewsPost);
router.get('/id/:id', authMiddleware, ctrl.getPostById);
router.get('/:slug', ctrl.getPostBySlug);
router.patch('/:id', authMiddleware, ctrl.updatePost);
router.delete('/:id', authMiddleware, ctrl.deletePost);
router.post('/:id/publish', authMiddleware, ctrl.publishPost);

module.exports = router;
