'use strict';
const { Router } = require('express');
const ctrl = require('../controller/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.post('/generate', authMiddleware, ctrl.generateReport);
router.get('/:report_id/download', authMiddleware, ctrl.downloadReport);

module.exports = router;
