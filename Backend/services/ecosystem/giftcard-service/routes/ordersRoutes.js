'use strict';
const { Router } = require('express');
const ctrl = require('../controller/ordersController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/brands/:slug/checkout', authMiddleware, ctrl.checkout);
router.get('/my-orders', authMiddleware, ctrl.listMyOrders);

module.exports = router;
