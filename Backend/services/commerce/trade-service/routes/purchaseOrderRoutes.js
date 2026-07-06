'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
    issuePurchaseOrder, acceptPurchaseOrder, rejectPurchaseOrder, cancelPurchaseOrder,
} = require('../controller/purchaseOrderController');

// Purchase orders are private buyer/seller party data, so every route requires auth.
router.get('/',               authMiddleware, listPurchaseOrders);
router.get('/:id',            authMiddleware, getPurchaseOrder);
router.post('/',              authMiddleware, createPurchaseOrder);
router.put('/:id',            authMiddleware, updatePurchaseOrder);
router.patch('/:id',          authMiddleware, updatePurchaseOrder);
router.patch('/:id/issue',    authMiddleware, issuePurchaseOrder);
router.patch('/:id/accept',   authMiddleware, acceptPurchaseOrder);
router.patch('/:id/reject',   authMiddleware, rejectPurchaseOrder);
router.patch('/:id/cancel',   authMiddleware, cancelPurchaseOrder);

module.exports = router;
