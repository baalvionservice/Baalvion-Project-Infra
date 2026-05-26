'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/disputeController');

router.get('/', authMiddleware, ctrl.listDisputes);
router.post('/', authMiddleware, ctrl.createDispute);
router.get('/:id', authMiddleware, ctrl.getDispute);
router.patch('/:id', authMiddleware, ctrl.updateDispute);

module.exports = router;
