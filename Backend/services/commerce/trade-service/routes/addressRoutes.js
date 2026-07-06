'use strict';
// Logistics Core Foundation (Phase 1) — logistics address book (distinct from
// /verified_addresses, which is KYC onboarding evidence).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/addressController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE, LOGISTICS_PERMISSIONS.WAREHOUSE_MANAGE);

router.get('/',      authMiddleware, c.list);
router.get('/:id',   authMiddleware, c.get);
router.post('/',     authMiddleware, manage, c.create);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
