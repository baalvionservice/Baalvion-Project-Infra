'use strict';
const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const ctrl = require('../controller/adminController');

// Every admin route requires a valid token AND an admin role.
router.use(authMiddleware, adminOnly);

// ── Dashboard + analytics ──────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/stats',     ctrl.getDashboardStats); // alias (back-compat)
router.get('/analytics', ctrl.getAnalytics);

// ── Moderation / lifecycle actions (declared before the generic catch-all) ──
router.patch('/users/:id/status',           ctrl.setUserStatus);
router.post ('/lawyers/:id/verify',          ctrl.verifyLawyer);
router.patch('/lawyers/:id/verify',          ctrl.verifyLawyer);
router.patch('/lawyers/:id/suspend',         ctrl.suspendLawyer);
router.patch('/lawyers/:id/activate',        ctrl.activateLawyer);
router.post ('/payments/:id/refund',         ctrl.refundPayment);
router.post ('/articles/:id/publish',        ctrl.publishArticle);
router.post ('/articles/:id/archive',        ctrl.archiveArticle);
router.patch('/subscriptions/:id/cancel',    ctrl.cancelSubscription);
router.post ('/notifications/broadcast',     ctrl.broadcast);

// ── Generic resource CRUD ("admin to everything") ───────────────────────────
router.get   ('/:resource',      ctrl.listResource);
router.post  ('/:resource',      ctrl.createResource);
router.get   ('/:resource/:id',  ctrl.getResource);
router.patch ('/:resource/:id',  ctrl.updateResource);
router.put   ('/:resource/:id',  ctrl.updateResource);
router.delete('/:resource/:id',  ctrl.deleteResource);

module.exports = router;
