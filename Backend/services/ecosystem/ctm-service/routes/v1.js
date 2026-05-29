'use strict';
const router = require('express').Router();
const ctrl = require('../controller/ctmController');
const ex = require('../controller/extrasController');
const obs = require('../controller/obsController');
const integ = require('../controller/integrationsController');
const payments = require('../controller/paymentsController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Authenticated + mirror the acting identity user into CTM (user_profiles).
const authed = [authMiddleware, ex.ensureUserProfile];

// READ-ACCESS NOTE: GET endpoints are `optionalAuth` because the frontend reads them
// from Next server actions (src/lib/api.ts, 'use server') which run server-side WITHOUT
// the browser-held access token. optionalAuth still populates req.auth when a valid token
// IS present (client-side ctmClient reads), so handlers can scope by req.auth when available.
// Every mutation (POST/PATCH/DELETE) stays hard-authed.
// TODO(hardening, Phase 2): move tenant-scoped reads (submissions/invoices/notifications)
// behind the BFF so the server action can forward the caller's identity, then re-tighten.

// ── Companies ─────────────────────────────────────────────────────────────────
router.get('/companies',          optionalAuth, ctrl.listCompanies);
router.get('/companies/:id',      optionalAuth, ctrl.getCompany);
router.post('/companies',         authed, ctrl.createCompany);
router.patch('/companies/:id',    authMiddleware, ctrl.updateCompany);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/tasks',              optionalAuth, ctrl.listTasks);
router.get('/tasks/:id',          optionalAuth, ctrl.getTask);
router.post('/tasks',             authed, ctrl.createTask);
router.patch('/tasks/:id',        authMiddleware, ctrl.updateTask);
router.post('/tasks/:id/publish', authMiddleware, ctrl.publishTask);
router.post('/tasks/:id/close',   authMiddleware, ctrl.closeTask);

// ── Submissions ───────────────────────────────────────────────────────────────
router.get('/submissions',               optionalAuth, ctrl.listSubmissions);
router.get('/submissions/:id',           optionalAuth, ctrl.getSubmission);
router.post('/submissions',              authed, ctrl.createSubmission);
router.patch('/submissions/:id',         authMiddleware, ctrl.updateSubmission);
router.patch('/submissions/:id/status',  authMiddleware, ctrl.updateSubmissionStatus);

// ── Evaluations ───────────────────────────────────────────────────────────────
router.get('/evaluations',         optionalAuth, ctrl.listEvaluations);
router.post('/evaluations',        authed, ctrl.createEvaluation);
router.get('/evaluation-schemas',  optionalAuth,   ctrl.getEvaluationSchemas);

// ── Users / Profiles ────────────────────────────────────────────────────────────
router.get('/users',                 optionalAuth,   ex.listUsers);
router.get('/users/:userId/badges',  optionalAuth,   ctrl.getUserBadges);
router.get('/users/:id',             optionalAuth,   ex.getUser);
router.post('/users',                authed,         ex.upsertUser);
router.patch('/users/:id',           authMiddleware, ex.updateUser);
router.get('/leaderboard',           optionalAuth,   ex.getLeaderboard);

// ── Badges ────────────────────────────────────────────────────────────────────
router.get('/badges',  optionalAuth, ctrl.listBadges);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams',  optionalAuth, ctrl.listTeams);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',        optionalAuth,   ex.listNotifications);
router.post('/notifications',       authMiddleware, ex.createNotification);
router.patch('/notifications/:id',  authMiddleware, ex.updateNotification);

// ── Task Templates ────────────────────────────────────────────────────────────
router.get('/templates',        optionalAuth,   ex.listTemplates);
router.post('/templates',       authed,         ex.createTemplate);
router.delete('/templates/:id', authMiddleware, ex.deleteTemplate);

// ── Plans & Subscriptions ─────────────────────────────────────────────────────
router.get('/plans',                 optionalAuth,   ctrl.listPlans);
router.get('/subscriptions',         optionalAuth,   ctrl.listSubscriptions);
router.post('/subscriptions',        authed,         ctrl.createSubscription);
router.patch('/subscriptions/:id',   authMiddleware, ctrl.updateSubscription);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get('/invoices',      optionalAuth,   ex.listInvoices);
router.get('/invoices/:id',  optionalAuth,   ex.getInvoice);
router.post('/invoices',     authed,         ex.createInvoice);

// ── Activities ────────────────────────────────────────────────────────────────
router.get('/activities',  optionalAuth, ctrl.listActivities);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics',  optionalAuth, ctrl.getAnalytics);

// ── Observability (admin) — real metrics from prom-client/process/DB ────────────
router.get('/observability/metrics',    optionalAuth, obs.getSystemMetrics);
router.get('/observability/services',   optionalAuth, obs.getServiceStatus);
router.get('/observability/load',       optionalAuth, obs.getServiceLoad);
router.get('/observability/scaling',    optionalAuth, obs.getScalingEvents);
router.get('/observability/incidents',  optionalAuth, obs.getSystemIncidents);
router.get('/observability/logs',       optionalAuth, obs.getSystemLogs);
router.get('/observability/errors',     optionalAuth, obs.getSystemErrors);

// ── Revenue & usage analytics — computed from real subscriptions/plans/tasks ────
router.get('/revenue/metrics',       optionalAuth, obs.getRevenueMetrics);
router.get('/revenue/plan-distribution', optionalAuth, obs.getPlanDistribution);
router.get('/revenue/sources',       optionalAuth, obs.getRevenueSources);
router.get('/usage/plan',            optionalAuth, obs.getPlanUsage);
router.get('/usage/metrics',         optionalAuth, obs.getUsageMetrics);

// ── Webhooks (outbound, HMAC-signed) — FULLY LIVE ───────────────────────────────
router.get('/webhooks',             optionalAuth,   integ.listWebhooks);
router.post('/webhooks',            authMiddleware, integ.createWebhook);
router.patch('/webhooks/:id',       authMiddleware, integ.updateWebhook);
router.delete('/webhooks/:id',      authMiddleware, integ.deleteWebhook);
router.get('/webhooks/:id/deliveries', optionalAuth, integ.getWebhookDeliveries);
router.post('/webhooks/:id/test',   authMiddleware, integ.testWebhook);

// ── API integrations registry + logs ────────────────────────────────────────────
router.get('/api-integrations',          optionalAuth,   integ.listApiIntegrations);
router.post('/api-integrations',         authMiddleware, integ.createApiIntegration);
router.patch('/api-integrations/:id',    authMiddleware, integ.updateApiIntegration);
router.delete('/api-integrations/:id',   authMiddleware, integ.deleteApiIntegration);
router.post('/api-integrations/:id/test', authMiddleware, integ.testApiIntegration);
router.get('/integration-logs',          optionalAuth,   integ.listIntegrationLogs);

// ── GitHub (real public-repo metadata; GITHUB_TOKEN optional) ───────────────────
router.get('/integrations/github/repos', optionalAuth, integ.listGitHubRepositories);
router.get('/integrations/github/repo',  optionalAuth, integ.getGitHubRepo);

// ── Test cases / auto-validation (Judge0 sandbox when configured) ────────────────
router.get('/submissions/:id/test-cases',     optionalAuth,   integ.listTestCases);
router.post('/submissions/:id/test-cases',    authMiddleware, integ.createTestCase);
router.post('/submissions/:id/test-cases/run', authMiddleware, integ.runTestCases);

// ── Payments (provider-agnostic: Stripe/Razorpay env-gated) ─────────────────────
router.get('/payments',          optionalAuth,   payments.listPayments);
router.get('/payments/provider', optionalAuth,   payments.providerStatus);
router.post('/payments/checkout', authMiddleware, payments.createCheckout);
router.post('/payments/webhook', payments.handleWebhook); // no auth — verified by provider signature

module.exports = router;
