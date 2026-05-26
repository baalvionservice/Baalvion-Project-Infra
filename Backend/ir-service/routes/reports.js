'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/reportController');

router.get('/', ctrl.listReports);
router.post('/', authMiddleware, ctrl.createReport);
router.get('/:id', ctrl.getReport);
router.patch('/:id', authMiddleware, ctrl.updateReport);
router.delete('/:id', authMiddleware, ctrl.deleteReport);
router.post('/:id/publish', authMiddleware, ctrl.publishReport);

module.exports = router;
