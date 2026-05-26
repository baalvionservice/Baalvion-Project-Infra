'use strict';
const { Router } = require('express');
const ctrl = require('../controller/disputeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listDisputes);
router.post('/', authMiddleware, ctrl.fileDispute);
router.patch('/:id', authMiddleware, ctrl.updateDispute);

module.exports = router;
