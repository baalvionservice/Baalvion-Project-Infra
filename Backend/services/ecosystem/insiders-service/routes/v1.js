'use strict';
const router = require('express').Router();
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/authMiddleware');
const query = require('../controller/queryController');
const rpc = require('../controller/rpcController');
const storage = require('../controller/storageController');
const fns = require('../controller/functionsController');
const authCtrl = require('../controller/authController');

router.use('/auth', require('./authRoutes'));

// BFF → SDK-native payment-service (Elite Circle gateway checkout). Supersedes the
// legacy /functions/payment-* handlers (which read provider keys from env).
router.use('/billing', require('./billingRoutes'));

// Canonical identity probe — returns the LOCAL users.id for a gateway-authenticated caller
// (+ roles + profile). The frontend reads this so its user.id matches backend ownership keys.
router.get('/whoami', authMiddleware, authCtrl.whoami);

// Public, unauthenticated, SEO-safe reads for the Next.js public site (curated subset only).
const pub = require('../controller/publicController');
router.get('/public/founders', pub.listFounders);
router.get('/public/founders/:id', pub.getFounder);
router.get('/public/investors', pub.listInvestors);
router.get('/public/investors/:id', pub.getInvestor);
router.get('/public/companies', pub.listCompanies);
router.get('/public/companies/:id', pub.getCompany);
router.get('/public/people', pub.searchPeople);
router.get('/public/people/:slug', pub.getPerson);
router.get('/public/articles', pub.listArticles);
router.get('/public/articles/:slug', pub.getArticle);
router.get('/public/places', pub.listPlaces);
const claims = require('../controller/claimController');
router.post('/public/claims', claims.createClaim);
router.get('/claims', authMiddleware, requireRole('admin'), claims.listClaims);
router.patch('/claims/:id', authMiddleware, requireRole('admin'), claims.reviewClaim);
router.get('/public/render', require('../controller/renderController').render);
router.get('/public/sitemap.xml', pub.sitemapIndex);
router.get('/public/sitemap-:section.xml', pub.sitemapSection);

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
