'use strict';
const { Router } = require('express');
const ctrl = require('../controller/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listPayments);
router.post('/', authMiddleware, ctrl.createPayment);
router.get('/:id', authMiddleware, ctrl.getPayment);
router.post('/:id/pay', authMiddleware, ctrl.markPaid);
router.post('/:id/escrow', authMiddleware, ctrl.moveToEscrow);
router.post('/:id/release', authMiddleware, ctrl.releaseEscrow);

module.exports = router;
