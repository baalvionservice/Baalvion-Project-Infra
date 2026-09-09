'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/adminController');
const { requireSuperAdmin, requireStaffAdmin } = require('../middleware/authMiddleware');

// Platform-staff tier: EXACT match on admin/super_admin, NOT hierarchical. `owner` is a
// self-service role (registration makes every user owner of their own org), so a
// hierarchical admin gate handed these surfaces to the entire public.
router.use(requireStaffAdmin);

// Three operations stay super_admin-only. They are irreversible or allow acting as someone
// else, so they warrant the narrower gate even inside a trusted admin tier.
const superAdminOnly = requireSuperAdmin;

// Platform stats
router.get('/stats', ctrl.getPlatformStats);

// User management
router.get('/users',                   ctrl.listUsers);
router.get('/users/:userId',           ctrl.getUserDetail);
router.patch('/users/:userId',         ctrl.updateUser);
router.delete('/users/:userId',        superAdminOnly, ctrl.deleteUser);
// Org-role change. Rank guards (cannot grant above your own, cannot change your own,
// cannot remove the last super_admin) are enforced in the service.
router.patch('/users/:userId/role',    ctrl.changeUserRole);
router.post('/users/:userId/suspend',  ctrl.suspendUser);
router.post('/users/:userId/unsuspend', ctrl.unsuspendUser);
router.post('/users/:userId/send-verification', ctrl.sendUserVerification);
router.post('/users/:userId/revoke-sessions',   ctrl.revokeUserSessions);
router.post('/users/:userId/impersonate', superAdminOnly, ctrl.impersonate);

// Org management
router.get('/orgs',                  ctrl.listOrgs);
router.post('/orgs',                 ctrl.createOrg);
router.get('/orgs/:orgId',           ctrl.getOrgDetail);
router.patch('/orgs/:orgId',         ctrl.updateOrg);
router.delete('/orgs/:orgId',        superAdminOnly, ctrl.deleteOrg);
router.post('/orgs/:orgId/suspend',  ctrl.suspendOrg);

// Session management
router.get('/sessions',               ctrl.listAllSessions);
router.delete('/sessions/:sessionId', ctrl.revokeSession);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

// Sign-in activity per property — who signed in on which site, from auth.auth_audit_log.
router.get('/login-activity', ctrl.getLoginActivity);

// Per-business access (trade, jobs, ir, …) — the non-CMS half of one-panel access control.
// Inherits requireStaffAdmin from the router-level gate above.
const bizCtrl = require('../controller/businessAccessController');
router.get('/business-access/catalog',       bizCtrl.getCatalog);
router.get('/business-access',               bizCtrl.listAll);
router.get('/business-access/:userId',       bizCtrl.listForUser);
router.post('/business-access',              bizCtrl.grant);
router.delete('/business-access/:userId',    bizCtrl.revoke);

// Billing / payments
router.use('/payments', require('./paymentsRoutes'));

module.exports = router;
