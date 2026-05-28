'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/filingController');

router.get('/', ctrl.listFilings);
router.post('/', authMiddleware, ctrl.createFiling);
router.get('/:id', ctrl.getFiling);
router.patch('/:id', authMiddleware, ctrl.updateFiling);
router.delete('/:id', authMiddleware, ctrl.deleteFiling);

module.exports = router;
