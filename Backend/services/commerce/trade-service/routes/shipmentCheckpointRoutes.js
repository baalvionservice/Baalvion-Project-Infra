'use strict';
// Shipment Tracking & Global Visibility Platform — physical checkpoint arrive/depart.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/shipmentCheckpointController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.CHECKPOINT_MANAGE);

router.get('/',    authMiddleware, c.list);
router.get('/:id', authMiddleware, c.get);
router.post('/arrive',        authMiddleware, manage, c.arrive);
router.post('/:id/depart',    authMiddleware, manage, c.depart);

module.exports = router;
