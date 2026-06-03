'use strict';
// Developer Platform console routes. Mounted under /v1/developer (see routes/v1.js).
// Every route is gated by requireSuperAdmin — identical to adminRoutes — so this module
// enforces the same super-admin policy on its own even though it mounts as a sibling.
const router = require('express').Router();
const ctrl   = require('../controller/developerController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

// All developer-platform routes require super_admin.
router.use(requireSuperAdmin);

// API usage stats
router.get('/stats', ctrl.getApiStats);

// Webhooks — CRUD
router.get('/webhooks',            ctrl.listWebhooks);
router.post('/webhooks',           ctrl.createWebhook);
router.get('/webhooks/:id',        ctrl.getWebhook);
router.patch('/webhooks/:id',      ctrl.updateWebhook);
router.delete('/webhooks/:id',     ctrl.deleteWebhook);
router.post('/webhooks/:id/test',  ctrl.testWebhook);

// Webhook deliveries
router.get('/webhooks/:webhookId/deliveries', ctrl.listDeliveries);
router.post('/deliveries/:deliveryId/retry',  ctrl.retryDelivery);

// Changelog (static real catalog)
router.get('/changelog', ctrl.listChangelog);

// SDK registry (static real catalog)
router.get('/sdks', ctrl.listSdks);

// Sandboxes
router.get('/sandboxes',             ctrl.listSandboxes);
router.post('/sandboxes',            ctrl.createSandbox);
router.post('/sandboxes/:id/reset',  ctrl.resetSandbox);
router.delete('/sandboxes/:id',      ctrl.deleteSandbox);

module.exports = router;
