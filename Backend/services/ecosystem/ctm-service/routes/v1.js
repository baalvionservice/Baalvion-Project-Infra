'use strict';
const router = require('express').Router();
const ctrl = require('../controller/ctmController');
const ex = require('../controller/extrasController');
const obs = require('../controller/obsController');
const integ = require('../controller/integrationsController');
const payments = require('../controller/paymentsController');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Authenticated + mirror the acting identity user into CTM (user_profiles).
const authed = [authMiddleware, ex.ensureUserProfile];

// READ-ACCESS NOTE: PUBLIC marketing reads (companies, tasks, plans, badges, leaderboard,
// single candidate profile) stay `optionalAuth` so Next server actions can render them
// without the browser-held token; the single profile is returned through a public-safe
// projection. SENSITIVE reads that expose PII / billing / candidate work / tenant data
// (users list, submissions, invoices, subscriptions, evaluations, evaluation-schemas,
// activities, analytics, teams, notifications, webhooks, integrations incl. GitHub,
// test-cases) require `authMiddleware` and are tenant-scoped in their controllers. These
// back admin-only surfaces ((app)/admin/*) and must never be anonymously readable. Every
// mutation (POST/PATCH/DELETE) is hard-authed + ownership-checked.
// Phase 2: route authenticated reads through the BFF so server actions forward identity.

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
// Submissions are candidate work + scores (sensitive). Require auth; the controller
// scopes the result to the caller's own submissions or their company's tasks.
router.get('/submissions',               authMiddleware, ctrl.listSubmissions);
router.get('/submissions/:id',           authMiddleware, ctrl.getSubmission);
router.post('/submissions',              authed, ctrl.createSubmission);
router.patch('/submissions/:id',         authMiddleware, ctrl.updateSubmission);
router.patch('/submissions/:id/status',  authMiddleware, ctrl.updateSubmissionStatus);

// ── Evaluations ───────────────────────────────────────────────────────────────
router.get('/evaluations',         authMiddleware, ctrl.listEvaluations);
router.post('/evaluations',        authed, ctrl.createEvaluation);
// Scoring rubrics are internal admin config (reveal how candidates are graded) → require auth.
router.get('/evaluation-schemas',  authMiddleware, ctrl.getEvaluationSchemas);

// ── Users / Profiles ────────────────────────────────────────────────────────────
// The directory list exposes emails/PII across tenants → require auth (handler still
// returns the full set for admins; everyone else is scoped to their own org/profile).
// The SINGLE profile (`/users/:id`) stays public: it is the candidate marketing page
// and is returned through a public-safe projection in the controller.
router.get('/users',                 authMiddleware, ex.listUsers);
router.get('/users/:userId/badges',  optionalAuth,   ctrl.getUserBadges);
router.get('/users/:id',             optionalAuth,   ex.getUser);
router.post('/users',                authed,         ex.upsertUser);
router.patch('/users/:id',           authMiddleware, ex.updateUser);
router.get('/leaderboard',           optionalAuth,   ex.getLeaderboard);

// ── Badges ────────────────────────────────────────────────────────────────────
router.get('/badges',  optionalAuth, ctrl.listBadges);

// ── Teams ─────────────────────────────────────────────────────────────────────
// Org team rosters expose internal structure ((app)/admin/teams) → require auth.
router.get('/teams',  authMiddleware, ctrl.listTeams);

// ── Notifications ─────────────────────────────────────────────────────────────
// `?scope=all` (admin firehose) requires a real session; the default per-user view
// also needs identity. Require auth; the controller scopes by req.auth.userId.
router.get('/notifications',        authMiddleware, ex.listNotifications);
router.post('/notifications',       authMiddleware, ex.createNotification);
router.patch('/notifications/:id',  authMiddleware, ex.updateNotification);

// ── Task Templates ────────────────────────────────────────────────────────────
router.get('/templates',        optionalAuth,   ex.listTemplates);
router.post('/templates',       authed,         ex.createTemplate);
router.delete('/templates/:id', authMiddleware, ex.deleteTemplate);

// ── Plans & Subscriptions ─────────────────────────────────────────────────────
router.get('/plans',                 optionalAuth,   ctrl.listPlans);
// Subscription data is sensitive (billing, plan tier). Require auth; the handler
// scopes by req.auth.orgId so each caller only sees their own subscriptions.
router.get('/subscriptions',         authMiddleware, ctrl.listSubscriptions);
router.post('/subscriptions',        authed,         ctrl.createSubscription);
router.patch('/subscriptions/:id',   authMiddleware, ctrl.updateSubscription);

// ── Invoices ──────────────────────────────────────────────────────────────────
// Invoices are billing PII. Require auth; the handler scopes by the caller's org.
router.get('/invoices',      authMiddleware, ex.listInvoices);
router.get('/invoices/:id',  authMiddleware, ex.getInvoice);
router.post('/invoices',     authed,         ex.createInvoice);

// ── Activities ────────────────────────────────────────────────────────────────
router.get('/activities',  authMiddleware, ctrl.listActivities);

// ── Analytics ─────────────────────────────────────────────────────────────────
// Business analytics ((app)/admin/analytics) — aggregate tenant data, not a public read.
router.get('/analytics',  authMiddleware, ctrl.getAnalytics);

// ── Observability (admin) — real metrics from prom-client/process/DB ────────────
// These endpoints expose internal infrastructure data; restrict to admin/super_admin.
const adminOnly = [authMiddleware, requireRole('admin', 'super_admin')];
router.get('/observability/metrics',    adminOnly, obs.getSystemMetrics);
router.get('/observability/services',   adminOnly, obs.getServiceStatus);
router.get('/observability/load',       adminOnly, obs.getServiceLoad);
router.get('/observability/scaling',    adminOnly, obs.getScalingEvents);
router.get('/observability/incidents',  adminOnly, obs.getSystemIncidents);
router.get('/observability/logs',       adminOnly, obs.getSystemLogs);
router.get('/observability/errors',     adminOnly, obs.getSystemErrors);

// ── Revenue & usage analytics — computed from real subscriptions/plans/tasks ────
// Revenue data is commercially sensitive; restrict to admin/super_admin.
// /usage/* endpoints are per-company and require a valid session for scoping.
router.get('/revenue/metrics',       adminOnly, obs.getRevenueMetrics);
router.get('/revenue/plan-distribution', adminOnly, obs.getPlanDistribution);
router.get('/revenue/sources',       adminOnly, obs.getRevenueSources);
router.get('/usage/plan',            authMiddleware, obs.getPlanUsage);
router.get('/usage/metrics',         authMiddleware, obs.getUsageMetrics);

// ── Webhooks (outbound, HMAC-signed) — FULLY LIVE ───────────────────────────────
router.get('/webhooks',             authMiddleware, integ.listWebhooks);
router.post('/webhooks',            authMiddleware, integ.createWebhook);
router.patch('/webhooks/:id',       authMiddleware, integ.updateWebhook);
router.delete('/webhooks/:id',      authMiddleware, integ.deleteWebhook);
router.get('/webhooks/:id/deliveries', authMiddleware, integ.getWebhookDeliveries);
router.post('/webhooks/:id/test',   authMiddleware, integ.testWebhook);

// ── API integrations registry + logs ────────────────────────────────────────────
router.get('/api-integrations',          authMiddleware, integ.listApiIntegrations);
router.post('/api-integrations',         authMiddleware, integ.createApiIntegration);
router.patch('/api-integrations/:id',    authMiddleware, integ.updateApiIntegration);
router.delete('/api-integrations/:id',   authMiddleware, integ.deleteApiIntegration);
router.post('/api-integrations/:id/test', authMiddleware, integ.testApiIntegration);
// Integration logs are internal infra telemetry; require auth (no per-tenant column on
// this global log, so restrict to admins in the controller).
router.get('/integration-logs',          adminOnly,      integ.listIntegrationLogs);

// ── GitHub (real repo metadata; GITHUB_TOKEN optional) ──────────────────────────
// Integration reads expose which repos an org wires up ((app)/admin/integrations) → require auth.
router.get('/integrations/github/repos', authMiddleware, integ.listGitHubRepositories);
router.get('/integrations/github/repo',  authMiddleware, integ.getGitHubRepo);

// ── Test cases / auto-validation (Judge0 sandbox when configured) ────────────────
router.get('/submissions/:id/test-cases',     authMiddleware, integ.listTestCases);
router.post('/submissions/:id/test-cases',    authMiddleware, integ.createTestCase);
router.post('/submissions/:id/test-cases/run', authMiddleware, integ.runTestCases);

// ── Payments (provider-agnostic: Stripe/Razorpay/PayU/Cashfree, vault- or env-gated) ────────────
// Payment records contain financial PII; require auth and scope by caller's org.
router.get('/payments',          authMiddleware,  payments.listPayments);
// Require auth: don't disclose which providers are configured to anonymous callers (L1).
router.get('/payments/provider', authMiddleware,  payments.providerStatus);
// Admin pre-flight self-check (vault keys + webhook secrets resolvable) — no secrets exposed.
router.get('/payments/health',   adminOnly,       payments.health);
router.post('/payments/checkout', authMiddleware, payments.createCheckout);
router.post('/payments/webhook', payments.handleWebhook); // no auth — verified by provider signature (Stripe/Razorpay/Cashfree)
// PayU surl/furl: form-POST return, verified by SHA-512 reverse hash (no auth header). GET = a cancel bounce.
router.post('/payments/return/payu', payments.payuReturn);
router.get('/payments/return/payu', (req, res) => res.redirect(303, process.env.PAYMENT_CANCEL_URL || 'https://controlthemarket.com/company/billing?canceled=1'));

module.exports = router;
