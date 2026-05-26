'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/paymentController');

router.get('/',            authMiddleware, ctrl.listPayments);
router.post('/',           authMiddleware, ctrl.createPayment);
router.get('/:id',         authMiddleware, ctrl.getPayment);
router.post('/webhook',    ctrl.webhookHandler);

module.exports = router;
