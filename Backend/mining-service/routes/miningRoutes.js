const { Router } = require('express');
const ctrl = require('../controller/miningController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// ─── Mineral Categories (public) ──────────────────────────────────────────────
router.get('/minerals', ctrl.listMineralCategories);

// ─── Listings ────────────────────────────────────────────────────────────────
router.get('/listings', ctrl.listListings);
router.post('/listings', authMiddleware, ctrl.createListing);
router.get('/listings/:id', ctrl.getListing);
router.patch('/listings/:id', authMiddleware, ctrl.updateListing);
router.delete('/listings/:id', authMiddleware, ctrl.deleteListing);
router.post('/listings/:id/publish', authMiddleware, ctrl.publishListing);

// ─── RFQs ────────────────────────────────────────────────────────────────────
router.get('/rfq', authMiddleware, ctrl.listRfqs);
router.post('/rfq', authMiddleware, ctrl.createRfq);
router.get('/rfq/:id', authMiddleware, ctrl.getRfq);
router.patch('/rfq/:id', authMiddleware, ctrl.updateRfq);
router.get('/rfq/:id/bids', authMiddleware, ctrl.listRfqBids);
router.post('/rfq/:id/bids', authMiddleware, ctrl.submitBid);
router.patch('/rfq/:rfqId/bids/:bidId', authMiddleware, ctrl.updateBid);

// ─── Orders ──────────────────────────────────────────────────────────────────
router.get('/orders', authMiddleware, ctrl.listOrders);
router.post('/orders', authMiddleware, ctrl.createOrder);
router.get('/orders/:id', authMiddleware, ctrl.getOrder);
router.patch('/orders/:id', authMiddleware, ctrl.updateOrder);
router.post('/orders/:id/confirm', authMiddleware, ctrl.confirmOrder);
router.post('/orders/:id/cancel', authMiddleware, ctrl.cancelOrder);

// ─── Logistics ────────────────────────────────────────────────────────────────
router.get('/logistics', authMiddleware, ctrl.listShipments);
router.post('/logistics', authMiddleware, ctrl.createShipment);
router.get('/logistics/:id', authMiddleware, ctrl.getShipment);
router.patch('/logistics/:id', authMiddleware, ctrl.updateShipment);
router.post('/logistics/:id/checkpoint', authMiddleware, ctrl.addCheckpoint);

// ─── Warehouses ───────────────────────────────────────────────────────────────
router.get('/warehouses', authMiddleware, ctrl.listWarehouses);
router.post('/warehouses', authMiddleware, ctrl.createWarehouse);
router.patch('/warehouses/:id', authMiddleware, ctrl.updateWarehouse);

// ─── Disputes ────────────────────────────────────────────────────────────────
router.get('/disputes', authMiddleware, ctrl.listDisputes);
router.post('/disputes', authMiddleware, ctrl.createDispute);
router.patch('/disputes/:id', authMiddleware, ctrl.updateDispute);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/trade', authMiddleware, ctrl.getTradeAnalytics);

module.exports = router;
