'use strict';
// Shipment Tracking & Global Visibility Platform — geofence CRUD + event log.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/geofenceController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.GEOFENCE_MANAGE);

router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.create);
router.get('/:id', authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);
router.get('/:id/events', authMiddleware, c.listEvents);

module.exports = router;
