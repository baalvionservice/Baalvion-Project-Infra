'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listPayments, getPayment, createPayment, updatePaymentStatus,
} = require('../controller/paymentController');

router.get('/',            authMiddleware, listPayments);
router.get('/:id',         authMiddleware, getPayment);
router.post('/',           authMiddleware, createPayment);
router.patch('/:id/status', authMiddleware, updatePaymentStatus);

module.exports = router;
