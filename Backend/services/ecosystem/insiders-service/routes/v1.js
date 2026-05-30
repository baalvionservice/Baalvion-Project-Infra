'use strict';
const router = require('express').Router();
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/authMiddleware');
const query = require('../controller/queryController');
const rpc = require('../controller/rpcController');
const storage = require('../controller/storageController');
const fns = require('../controller/functionsController');
const authCtrl = require('../controller/authController');

router.use('/auth', require('./authRoutes'));

// Canonical identity probe — returns the LOCAL users.id for a gateway-authenticated caller
// (+ roles + profile). The frontend reads this so its user.id matches backend ownership keys.
router.get('/whoami', authMiddleware, authCtrl.whoami);

// Public, unauthenticated, SEO-safe reads for the Next.js public site (curated subset only).
const pub = require('../controller/publicController');
router.get('/public/founders', pub.listFounders);
router.get('/public/founders/:id', pub.getFounder);
router.get('/public/investors', pub.listInvestors);
router.get('/public/investors/:id', pub.getInvestor);

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
