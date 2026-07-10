'use strict';
// Shipment Tracking & Global Visibility Platform — IoT device registry + readings.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/iotDeviceController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.IOT_MANAGE);

router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.register);
router.get('/:id', authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.post('/:id/readings', authMiddleware, manage, c.ingestReading);
router.get('/:id/readings',  authMiddleware, c.listReadings);

module.exports = router;
