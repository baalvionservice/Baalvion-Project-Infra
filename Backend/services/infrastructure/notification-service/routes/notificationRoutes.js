'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/notificationController');
const { internalAuth, authMiddleware } = require('../middleware/authMiddleware');

// ── Internal (service-to-service) channel endpoints ────────────────────────────
router.post('/email',     internalAuth, ctrl.enqueueEmail);
router.post('/email/sync', internalAuth, ctrl.sendEmailSync);
router.post('/webhook',   internalAuth, ctrl.enqueueWebhook);
router.post('/sms',       internalAuth, ctrl.enqueueSms);
router.post('/push',      internalAuth, ctrl.enqueuePush);
// Unified multi-channel fan-out (email/sms/push/in-app, honors prefs)
router.post('/dispatch',  internalAuth, ctrl.dispatch);

// ── Device tokens (user manages their own; needed for push) ────────────────────
router.get('/devices',           authMiddleware, ctrl.listDevices);
router.post('/devices',          authMiddleware, ctrl.registerDevice);
router.delete('/devices/:token', authMiddleware, ctrl.unregisterDevice);

// ── Channel preferences (user) ─────────────────────────────────────────────────
router.get('/preferences',  authMiddleware, ctrl.getPreferences);
router.put('/preferences',  authMiddleware, ctrl.updatePreferences);

// ── In-app inbox (user) ────────────────────────────────────────────────────────
router.get('/inbox',           authMiddleware, ctrl.getInbox);
router.post('/inbox/read',     authMiddleware, ctrl.markInboxAllRead);
router.post('/inbox/:id/read', authMiddleware, ctrl.markInboxRead);

// ── Admin (JWT) — queues + DLQ ──────────────────────────────────────────────────
router.get('/queues/stats',               authMiddleware, ctrl.getQueueStats);
router.get('/queues/dlq',                 authMiddleware, ctrl.getDlq);
router.post('/queues/dlq/:entryId/retry', authMiddleware, ctrl.retryDlqItem);

module.exports = router;
