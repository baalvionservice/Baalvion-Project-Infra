'use strict';
const { Router } = require('express');
const ctrl = require('../controller/shareholderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listShareholders);
router.post('/', authMiddleware, ctrl.createShareholder);
router.get('/:id', authMiddleware, ctrl.getShareholder);
router.patch('/:id', authMiddleware, ctrl.updateShareholder);

module.exports = router;
