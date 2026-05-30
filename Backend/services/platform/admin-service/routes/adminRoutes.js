'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/adminController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

// All admin routes require super_admin role
router.use(requireSuperAdmin);

// Platform stats
router.get('/stats', ctrl.getPlatformStats);

// User management
router.get('/users',                   ctrl.listUsers);
router.get('/users/:userId',           ctrl.getUserDetail);
router.post('/users/:userId/suspend',  ctrl.suspendUser);
router.post('/users/:userId/unsuspend', ctrl.unsuspendUser);
router.post('/users/:userId/impersonate', ctrl.impersonate);

// Org management
router.get('/orgs', ctrl.listOrgs);

// Session management
router.get('/sessions',               ctrl.listAllSessions);
router.delete('/sessions/:sessionId', ctrl.revokeSession);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

// Billing / payments
router.use('/payments', require('./paymentsRoutes'));

module.exports = router;
