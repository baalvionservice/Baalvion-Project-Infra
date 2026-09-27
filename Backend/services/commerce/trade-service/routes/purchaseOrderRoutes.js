'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
    issuePurchaseOrder, acceptPurchaseOrder, rejectPurchaseOrder, cancelPurchaseOrder,
} = require('../controller/purchaseOrderController');

// Purchase orders are private buyer/seller party data, so every route requires auth. The buyer
// issues a PO; the seller accepts or rejects it. cancel is left open to either party.
router.get('/',               authMiddleware, listPurchaseOrders);
router.get('/:id',            authMiddleware, getPurchaseOrder);
router.post('/',              authMiddleware, requireOrgType('buyer'), createPurchaseOrder);
router.put('/:id',            authMiddleware, requireOrgType('buyer'), updatePurchaseOrder);
router.patch('/:id',          authMiddleware, requireOrgType('buyer'), updatePurchaseOrder);
router.patch('/:id/issue',    authMiddleware, requireOrgType('buyer'), issuePurchaseOrder);
router.patch('/:id/accept',   authMiddleware, requireOrgType('seller'), acceptPurchaseOrder);
router.patch('/:id/reject',   authMiddleware, requireOrgType('seller'), rejectPurchaseOrder);
router.patch('/:id/cancel',   authMiddleware, cancelPurchaseOrder);

module.exports = router;
