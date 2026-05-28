'use strict';
const router = require('express').Router();
const ctrl = require('../controller/articlesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listArticles);
router.post('/', authMiddleware, ctrl.createArticle);
router.get('/:id', ctrl.getArticle);
router.patch('/:id', authMiddleware, ctrl.updateArticle);
router.delete('/:id', authMiddleware, ctrl.deleteArticle);
router.post('/:id/publish', authMiddleware, ctrl.publishArticle);
router.post('/:id/like', authMiddleware, ctrl.likeArticle);

module.exports = router;
