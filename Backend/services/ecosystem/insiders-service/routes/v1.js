'use strict';
const router = require('express').Router();
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/authMiddleware');
const query = require('../controller/queryController');
const rpc = require('../controller/rpcController');
const storage = require('../controller/storageController');
const fns = require('../controller/functionsController');

router.use('/auth', require('./authRoutes'));

// Generic data layer (replaces PostgREST). Auth is optional at the edge; the
// engine enforces per-table authorization that replaces RLS.
router.post('/db/query', optionalAuth, query.handleQuery);

// RPCs (has_role / increment_thread_views / create_notification).
router.post('/rpc/:fn', optionalAuth, rpc.rpc);

// File storage (replaces Supabase Storage).
router.post('/storage/:bucket/upload', authMiddleware, storage.uploadHandler);

// Edge functions.
router.post('/functions/ai-chat', authMiddleware, fns.aiChat);
router.post('/functions/scheduled-tag-report', authMiddleware, requireRole('admin'), fns.scheduledTagReport);
router.post('/functions/update-report-schedule', authMiddleware, requireRole('admin'), fns.updateReportSchedule);
router.post('/functions/send-notification', authMiddleware, fns.sendNotification);
router.post('/functions/checkout', authMiddleware, fns.checkout);
router.post('/functions/profile-score', authMiddleware, fns.profileScore);
router.post('/functions/ai-analyze', authMiddleware, fns.aiAnalyze);
router.post('/functions/match-investors', authMiddleware, fns.matchInvestors);
router.post('/functions/payment-tiers', authMiddleware, fns.paymentTiers);
router.post('/functions/payment-order', authMiddleware, fns.paymentOrder);
router.post('/functions/payment-confirm', authMiddleware, fns.paymentConfirm);

module.exports = router;
