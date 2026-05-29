'use strict';
const { Router } = require('express');
const domainCtrl = require('../controller/domainController');
const shareholderCtrl = require('../controller/shareholderController');
const transactionCtrl = require('../controller/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

// Domain analytics
router.get('/domains/trends', authMiddleware, domainCtrl.getDomainTrends);

// Business analytics — ranking / comparison / deep-dive (derived from domains + kpis + financials)
router.get('/businesses', authMiddleware, domainCtrl.getBusinessAnalytics);

// Shareholder analytics
router.get('/shareholders/performance', authMiddleware, shareholderCtrl.getShareholderPerformance);

// Company summary (used by transactions/analytics page)
router.get('/company/summary', authMiddleware, transactionCtrl.getCompanySummary);

// Revenue forecast + AI recommendations (forecasting page)
router.get('/forecast', authMiddleware, transactionCtrl.getForecast);

module.exports = router;
