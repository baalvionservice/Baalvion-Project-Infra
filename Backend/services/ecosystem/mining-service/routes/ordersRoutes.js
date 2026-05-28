'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/ordersController');

router.get('/analytics/summary', authMiddleware, ctrl.getOrderAnalytics);
router.get('/', authMiddleware, ctrl.listOrders);
router.get('/:id', authMiddleware, ctrl.getOrder);
router.post('/:id/confirm', authMiddleware, ctrl.confirmOrder);
router.post('/:id/cancel', authMiddleware, ctrl.cancelOrder);
router.patch('/:id/payment', authMiddleware, ctrl.updatePayment);

module.exports = router;
