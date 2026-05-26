const router = require('express').Router();
const ctrl = require('../controller/brandConnectorController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ── Existing routes ────────────────────────────────────────────────────────────
router.use('/brands', require('./brandRoutes'));
router.use('/influencers', require('./influencerRoutes'));
router.use('/campaigns', require('./campaignRoutes'));
router.use('/partnerships', require('./partnershipRoutes'));

// Deliverables standalone update (e.g. submit/approve)
router.patch('/deliverables/:id', authMiddleware, ctrl.updateDeliverable);

// Analytics (auth) — existing
router.get('/analytics/campaigns', authMiddleware, ctrl.getCampaignAnalytics);

// ── New routes ─────────────────────────────────────────────────────────────────

// CRM / Leads
router.use('/leads', require('./crmRoutes'));

// AI Scoring (separate mount at /scoring)
router.use('/scoring', require('./scoringRoutes'));

// Deals
router.use('/deals', require('./dealsRoutes'));

// Proposals
router.use('/proposals', require('./proposalsRoutes'));

// Payments / Escrow
router.use('/payments', require('./paymentRoutes'));

// Outreach
router.use('/outreach', require('./outreachRoutes'));

// Matching
router.use('/matching', require('./matchingRoutes'));

// Creators (shortlisting)
router.use('/creators', require('./creatorsRoutes'));

// Acquisition
router.use('/acquisition', require('./acquisitionRoutes'));

// Billing
router.use('/billing', require('./billingRoutes'));

// Team
router.use('/team', require('./teamRoutes'));

// Notifications
router.use('/notifications', require('./notificationRoutes'));

// Analytics (new — overview, campaign/:id, creators/:campaignId)
// Note: mounted before existing /analytics/campaigns to let both coexist
router.use('/analytics', require('./analyticsRoutes'));

// Onboarding
router.use('/onboarding', require('./onboardingRoutes'));

// Automation
router.use('/automation', require('./automationRoutes'));

// Admin
router.use('/admin', require('./adminRoutes'));

// Disputes
router.use('/disputes', require('./disputeRoutes'));

module.exports = router;
