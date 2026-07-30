'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/subcategoriesController');

router.get('/', ctrl.listSubcategories);
router.get('/:id', ctrl.getSubcategory);
router.post('/', authMiddleware, ctrl.createSubcategory);
router.patch('/:id', authMiddleware, ctrl.updateSubcategory);
router.delete('/:id', authMiddleware, ctrl.deleteSubcategory);

module.exports = router;
