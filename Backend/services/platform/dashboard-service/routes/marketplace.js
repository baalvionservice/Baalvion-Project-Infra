'use strict';
const { Router } = require('express');
const ctrl = require('../controller/marketplaceController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/install', authMiddleware, ctrl.install);
router.delete('/install/:slug', authMiddleware, ctrl.uninstall);

module.exports = router;
