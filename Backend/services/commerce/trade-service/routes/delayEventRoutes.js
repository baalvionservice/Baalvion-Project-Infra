'use strict';
// Shipment Tracking & Global Visibility Platform — delay-cause feed.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/delayEventController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.ALERT_MANAGE);

router.get('/',    authMiddleware, c.list);
router.post('/:id/resolve', authMiddleware, manage, c.resolve);
router.post('/sweep',       authMiddleware, manage, c.sweep);

module.exports = router;
