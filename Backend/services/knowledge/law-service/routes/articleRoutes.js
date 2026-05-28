'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/articleController');

router.get('/',                  ctrl.listArticles);
router.post('/',                 authMiddleware, ctrl.createArticle);
router.get('/:id',               ctrl.getArticle);
router.patch('/:id',             authMiddleware, ctrl.updateArticle);
router.post('/:id/publish',      authMiddleware, ctrl.publishArticle);
router.post('/:id/archive',      authMiddleware, ctrl.archiveArticle);

module.exports = router;
