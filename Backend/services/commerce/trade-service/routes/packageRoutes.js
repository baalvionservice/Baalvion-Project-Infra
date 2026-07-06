'use strict';
// Logistics Core Foundation (Phase 1) — package/cargo units.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/packageController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE, LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE);

router.get('/',      authMiddleware, c.list);
router.get('/:id',   authMiddleware, c.get);
router.post('/',     authMiddleware, manage, c.create);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
