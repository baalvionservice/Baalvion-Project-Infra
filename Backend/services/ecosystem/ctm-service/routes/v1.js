'use strict';
const router = require('express').Router();
const ctrl = require('../controller/ctmController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// ── Companies ─────────────────────────────────────────────────────────────────
router.get('/companies',          optionalAuth, ctrl.listCompanies);
router.get('/companies/:id',      optionalAuth, ctrl.getCompany);
router.post('/companies',         authMiddleware, ctrl.createCompany);
router.patch('/companies/:id',    authMiddleware, ctrl.updateCompany);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/tasks',              optionalAuth, ctrl.listTasks);
router.get('/tasks/:id',          optionalAuth, ctrl.getTask);
router.post('/tasks',             authMiddleware, ctrl.createTask);
router.patch('/tasks/:id',        authMiddleware, ctrl.updateTask);
router.post('/tasks/:id/publish', authMiddleware, ctrl.publishTask);
router.post('/tasks/:id/close',   authMiddleware, ctrl.closeTask);

// ── Submissions ───────────────────────────────────────────────────────────────
router.get('/submissions',               authMiddleware, ctrl.listSubmissions);
router.get('/submissions/:id',           authMiddleware, ctrl.getSubmission);
router.post('/submissions',              authMiddleware, ctrl.createSubmission);
router.patch('/submissions/:id',         authMiddleware, ctrl.updateSubmission);
router.patch('/submissions/:id/status',  authMiddleware, ctrl.updateSubmissionStatus);

// ── Evaluations ───────────────────────────────────────────────────────────────
router.get('/evaluations',         authMiddleware, ctrl.listEvaluations);
router.post('/evaluations',        authMiddleware, ctrl.createEvaluation);
router.get('/evaluation-schemas',  optionalAuth,   ctrl.getEvaluationSchemas);

// ── Badges ────────────────────────────────────────────────────────────────────
router.get('/badges',                       optionalAuth,  ctrl.listBadges);
router.get('/users/:userId/badges',         authMiddleware, ctrl.getUserBadges);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams',  authMiddleware, ctrl.listTeams);

// ── Plans & Subscriptions ─────────────────────────────────────────────────────
router.get('/plans',                 optionalAuth,   ctrl.listPlans);
router.get('/subscriptions',         authMiddleware, ctrl.listSubscriptions);
router.post('/subscriptions',        authMiddleware, ctrl.createSubscription);
router.patch('/subscriptions/:id',   authMiddleware, ctrl.updateSubscription);

// ── Activities ────────────────────────────────────────────────────────────────
router.get('/activities',  authMiddleware, ctrl.listActivities);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics',  authMiddleware, ctrl.getAnalytics);

module.exports = router;
