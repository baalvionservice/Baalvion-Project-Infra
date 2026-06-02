'use strict';
const express = require('express');
const ctrl = require('../controllers/reportController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, internalOrUser } = require('../middleware/authMiddleware');
const { requireReportRole } = require('../middleware/guards');

const router = express.Router();

// All report routes require a report role (or service principal).
router.use(internalOrUser, requireReportRole);

// ── meta ──
router.get('/formats',     asyncHandler(ctrl.formats));
router.get('/datasources', asyncHandler(ctrl.datasources));

// ── schedules (declared before /reports/:id so /schedules doesn't shadow) ──
router.get('/schedules',        asyncHandler(ctrl.listSchedules));
router.patch('/schedules/:id',  asyncHandler(ctrl.updateSchedule));
router.delete('/schedules/:id', asyncHandler(ctrl.deleteSchedule));

// ── runs ──
router.get('/runs/:runId',          asyncHandler(ctrl.getRun));
router.get('/runs/:runId/download',  asyncHandler(ctrl.download));

// ── definitions ──
router.post('/reports',                  asyncHandler(ctrl.create));
router.get('/reports',                   asyncHandler(ctrl.list));
router.get('/reports/:id',               asyncHandler(ctrl.get));
router.patch('/reports/:id',             asyncHandler(ctrl.update));
router.delete('/reports/:id',            asyncHandler(ctrl.remove));

// ── run / preview / history / schedules-for-a-report ──
router.post('/reports/:id/run',          asyncHandler(ctrl.run));
router.post('/reports/:id/preview',      asyncHandler(ctrl.preview));
router.get('/reports/:id/runs',          asyncHandler(ctrl.listRuns));
router.post('/reports/:id/schedules',    asyncHandler(ctrl.createSchedule));
router.get('/reports/:id/schedules',     asyncHandler(ctrl.listSchedules));

module.exports = router;
