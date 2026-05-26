'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/shareholderController');

router.get('/', authMiddleware, ctrl.listShareholders);
router.post('/', authMiddleware, ctrl.createShareholder);
router.patch('/:id', authMiddleware, ctrl.updateShareholder);
router.delete('/:id', authMiddleware, ctrl.deleteShareholder);

module.exports = router;
