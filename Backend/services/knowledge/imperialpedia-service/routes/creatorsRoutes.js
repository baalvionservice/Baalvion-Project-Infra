'use strict';
const router = require('express').Router();
const ctrl = require('../controller/creatorsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listCreators);
router.get('/:id', ctrl.getCreator);
router.patch('/:id', authMiddleware, ctrl.updateCreator);
router.get('/:id/articles', ctrl.getCreatorArticles);

module.exports = router;
