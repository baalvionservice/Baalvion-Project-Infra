'use strict';
// Logistics Core Foundation (Phase 1) — GPS/carrier tracking events (append-only).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/trackingController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.TRACKING_MANAGE);

router.get('/',    authMiddleware, c.list);
router.get('/:id', authMiddleware, c.get);
router.post('/',   authMiddleware, manage, c.create);

module.exports = router;
