'use strict';
const router = require('express').Router();
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controller/reportController');

// GET routes use optionalAuth: an authenticated admin sees their org's reports across
// all statuses (draft/review/published); anonymous callers get the public view
// (default org, published-only).
router.get('/', optionalAuth, ctrl.listReports);
router.post('/', authMiddleware, ctrl.createReport);
router.get('/:id', optionalAuth, ctrl.getReport);
router.patch('/:id', authMiddleware, ctrl.updateReport);
router.delete('/:id', authMiddleware, ctrl.deleteReport);
router.post('/:id/publish', authMiddleware, ctrl.publishReport);

module.exports = router;
