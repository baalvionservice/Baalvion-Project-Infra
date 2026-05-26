'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/scheduledReportController');

router.get('/', authMiddleware, ctrl.listScheduledReports);
router.post('/', authMiddleware, ctrl.createScheduledReport);
router.patch('/:id', authMiddleware, ctrl.updateScheduledReport);
router.delete('/:id', authMiddleware, ctrl.deleteScheduledReport);

module.exports = router;
