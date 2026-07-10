'use strict';
// Shipment Tracking & Global Visibility Platform — alert feed + ack/resolve.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/shipmentAlertController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.ALERT_MANAGE);

router.get('/',    authMiddleware, c.list);
router.get('/:id', authMiddleware, c.get);
router.post('/:id/acknowledge', authMiddleware, manage, c.acknowledge);
router.post('/:id/resolve',     authMiddleware, manage, c.resolve);
router.get('/:id/notifications', authMiddleware, c.listNotifications);
router.post('/:id/resend',       authMiddleware, manage, c.resend);

module.exports = router;
