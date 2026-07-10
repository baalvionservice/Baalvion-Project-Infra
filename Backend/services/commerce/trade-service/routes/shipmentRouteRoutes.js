'use strict';
// Shipment Tracking & Global Visibility Platform — planned/actual multi-leg journey.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/shipmentRouteController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.CHECKPOINT_MANAGE);

router.get('/:shipmentId', authMiddleware, c.listForShipment);
router.post('/',   authMiddleware, manage, c.create);
router.patch('/:id', authMiddleware, manage, c.update);

module.exports = router;
