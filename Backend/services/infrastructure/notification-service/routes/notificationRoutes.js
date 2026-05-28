'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/notificationController');
const { internalAuth } = require('../middleware/authMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

// Internal (service-to-service) endpoints
router.post('/email',        internalAuth, ctrl.enqueueEmail);
router.post('/email/sync',   internalAuth, ctrl.sendEmailSync);
router.post('/webhook',      internalAuth, ctrl.enqueueWebhook);

// Admin endpoints (JWT auth required)
router.get('/queues/stats',         authMiddleware, ctrl.getQueueStats);
router.get('/queues/dlq',           authMiddleware, ctrl.getDlq);
router.post('/queues/dlq/:entryId/retry', authMiddleware, ctrl.retryDlqItem);

module.exports = router;
