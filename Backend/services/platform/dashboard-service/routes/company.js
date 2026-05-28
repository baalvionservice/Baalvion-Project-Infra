'use strict';
const { Router } = require('express');
const ctrl = require('../controller/companyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/dashboard/total', authMiddleware, ctrl.getDashboardTotal);
router.get('/dashboard/domains', authMiddleware, ctrl.getDashboardDomains);
router.get('/dashboard/shareholder/:id', authMiddleware, ctrl.getShareholderDashboard);

module.exports = router;
