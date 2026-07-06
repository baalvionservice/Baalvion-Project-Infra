'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
    dashboard, analytics, listAdminOrgs,
    listAdminUsers, updateAdminUser,
    listAdminListings, updateAdminListingStatus, deleteAdminListing,
    listAdminRfqs, updateAdminRfqStatus,
    listAdminPurchaseOrders,
    listAdminOrders, listAdminPayments, listAdminDocuments,
} = require('../controller/adminController');

router.use(authMiddleware);
router.use(requireRole('admin', 'operator'));

router.get('/dashboard',    dashboard);
router.get('/analytics',    analytics);
router.get('/organizations', listAdminOrgs);

// Phase 1 admin panel — users/products/rfqs/purchase-orders (moderation) and
// orders/payments/documents (read-only; see adminController for why).
router.get('/users',           listAdminUsers);
router.patch('/users/:id',     updateAdminUser);
router.get('/products',        listAdminListings);
router.patch('/products/:id',  updateAdminListingStatus);
router.delete('/products/:id', deleteAdminListing);
router.get('/rfqs',            listAdminRfqs);
router.patch('/rfqs/:id/status', updateAdminRfqStatus);
router.get('/purchase_orders', listAdminPurchaseOrders);
router.get('/orders',          listAdminOrders);
router.get('/payments',        listAdminPayments);
router.get('/documents',       listAdminDocuments);

module.exports = router;
