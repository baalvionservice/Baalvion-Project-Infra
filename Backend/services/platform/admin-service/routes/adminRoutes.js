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
router.patch('/users/:userId',         ctrl.updateUser);
router.delete('/users/:userId',        ctrl.deleteUser);
router.post('/users/:userId/suspend',  ctrl.suspendUser);
router.post('/users/:userId/unsuspend', ctrl.unsuspendUser);
router.post('/users/:userId/send-verification', ctrl.sendUserVerification);
router.post('/users/:userId/revoke-sessions',   ctrl.revokeUserSessions);
router.post('/users/:userId/impersonate', ctrl.impersonate);

// Org management
router.get('/orgs',                  ctrl.listOrgs);
router.post('/orgs',                 ctrl.createOrg);
router.get('/orgs/:orgId',           ctrl.getOrgDetail);
router.patch('/orgs/:orgId',         ctrl.updateOrg);
router.delete('/orgs/:orgId',        ctrl.deleteOrg);
router.post('/orgs/:orgId/suspend',  ctrl.suspendOrg);

// Session management
router.get('/sessions',               ctrl.listAllSessions);
router.delete('/sessions/:sessionId', ctrl.revokeSession);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

// Billing / payments
router.use('/payments', require('./paymentsRoutes'));

module.exports = router;
