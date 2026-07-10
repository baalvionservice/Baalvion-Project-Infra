'use strict';
// Shipment Tracking & Global Visibility Platform — live in-transit ETA prediction.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/etaPredictionController');

const view = requirePermission(LOGISTICS_PERMISSIONS.ETA_VIEW);

router.get('/:shipmentId',          authMiddleware, view, c.listForShipment);
router.get('/:shipmentId/latest',   authMiddleware, view, c.latest);
router.post('/:shipmentId/recompute', authMiddleware, view, c.recompute);

module.exports = router;
