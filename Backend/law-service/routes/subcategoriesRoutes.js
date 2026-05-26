'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/subcategoriesController');

router.get('/', ctrl.listSubcategories);
router.get('/:id', ctrl.getSubcategory);
router.post('/', authMiddleware, ctrl.createSubcategory);

module.exports = router;
