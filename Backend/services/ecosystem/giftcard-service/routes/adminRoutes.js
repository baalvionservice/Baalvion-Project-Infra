'use strict';
const { Router } = require('express');
const ctrl = require('../controller/catalogController');
const { authMiddleware, requirePlatformAdmin } = require('../middleware/authMiddleware');

const router = Router();

router.post('/admin/catalog/sync', authMiddleware, requirePlatformAdmin, ctrl.syncCatalog);

module.exports = router;
