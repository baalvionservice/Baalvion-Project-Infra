'use strict';
const { Router } = require('express');
const domainCtrl = require('../controller/domainController');
const shareholderCtrl = require('../controller/shareholderController');
const transactionCtrl = require('../controller/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

// Domain analytics
router.get('/domains/trends', authMiddleware, domainCtrl.getDomainTrends);

// Shareholder analytics
router.get('/shareholders/performance', authMiddleware, shareholderCtrl.getShareholderPerformance);

// Company summary (used by transactions/analytics page)
router.get('/company/summary', authMiddleware, transactionCtrl.getCompanySummary);

module.exports = router;
