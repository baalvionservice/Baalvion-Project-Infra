'use strict';
const { Router } = require('express');
const ctrl = require('../controller/catalogController');
const merchantCtrl = require('../controller/merchantController');
const { authMiddleware, requirePlatformAdmin } = require('../middleware/authMiddleware');

const router = Router();

router.post('/admin/catalog/sync', authMiddleware, requirePlatformAdmin, ctrl.syncCatalog);
router.get('/admin/catalog', authMiddleware, requirePlatformAdmin, merchantCtrl.listCatalogAdmin);
router.get('/admin/orders', authMiddleware, requirePlatformAdmin, merchantCtrl.listOrders);
router.get('/admin/stats', authMiddleware, requirePlatformAdmin, merchantCtrl.getStats);

module.exports = router;
