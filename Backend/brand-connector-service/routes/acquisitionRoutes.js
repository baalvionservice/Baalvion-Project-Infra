'use strict';
const { Router } = require('express');
const ctrl = require('../controller/acquisitionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.post('/scrape', authMiddleware, ctrl.scrapeLeads);
router.post('/enrich', authMiddleware, ctrl.enrichLeads);
router.post('/import', authMiddleware, ctrl.importLeads);
router.get('/history', authMiddleware, ctrl.getHistory);

module.exports = router;
