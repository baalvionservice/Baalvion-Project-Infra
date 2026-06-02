'use strict';
const express = require('express');
const ctrl = require('../controllers/agentController');
const training = require('../controllers/trainingController');
const asyncHandler = require('../utils/asyncHandler');
const { internalOrUser } = require('../middleware/authMiddleware');
const { requireAgentAdmin, requireAgentWrite } = require('../middleware/guards');

const router = express.Router();
router.use(internalOrUser, requireAgentAdmin);

// ── commission plans ──
router.post('/plans', asyncHandler(ctrl.createPlan));
router.get('/plans',  asyncHandler(ctrl.listPlans));

// ── leaderboard ──
router.get('/leaderboard', asyncHandler(ctrl.leaderboard));

// ── sales + commission tracker (static before /agents/:id) ──
router.post('/sales', asyncHandler(ctrl.recordSale));
router.get('/sales',  asyncHandler(ctrl.listSales));
router.get('/commissions/summary',    asyncHandler(ctrl.commissionSummary));
router.get('/commissions',            asyncHandler(ctrl.listCommissions));
router.post('/commissions/transition', requireAgentWrite, asyncHandler(ctrl.transition));

// ── training: courses ──
router.post('/courses', asyncHandler(training.createCourse));
router.get('/courses',  asyncHandler(training.listCourses));
router.get('/courses/:id', asyncHandler(training.getCourse));
router.post('/courses/:id/modules',     asyncHandler(training.addModule));
router.post('/courses/:id/enroll',      asyncHandler(training.enroll));
router.post('/courses/:id/progress',    asyncHandler(training.completeModule));
router.post('/courses/:id/score',       asyncHandler(training.submitScore));
router.get('/courses/:id/enrollments',  asyncHandler(training.listEnrollments));

// ── agents ──
router.post('/agents', asyncHandler(ctrl.createAgent));
router.get('/agents',  asyncHandler(ctrl.listAgents));
router.get('/agents/:id', asyncHandler(ctrl.getAgent));
router.patch('/agents/:id', asyncHandler(ctrl.updateAgent));
router.get('/agents/:id/rank',     asyncHandler(ctrl.agentRank));
router.post('/agents/:id/payout',  requireAgentWrite, asyncHandler(ctrl.payout));
router.get('/agents/:agentId/certifications', asyncHandler(training.agentCerts));

module.exports = router;
