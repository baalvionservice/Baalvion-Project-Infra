'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/categoriesController');

router.get('/', ctrl.listCategories);
router.get('/:slugOrId', ctrl.getCategory);
router.post('/', authMiddleware, ctrl.createCategory);
router.patch('/:id', authMiddleware, ctrl.updateCategory);

module.exports = router;
