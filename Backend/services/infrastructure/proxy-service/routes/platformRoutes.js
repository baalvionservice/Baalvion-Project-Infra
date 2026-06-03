const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireOrganizationAccess = require('../middleware/requireOrganizationAccess');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/permissionMiddleware');
const controller = require('../controller/platformController');
const privacy = require('../controller/privacyController');
const enterprise = require('../controller/enterpriseController');
const analytics = require('../controller/analyticsController');
const marketplace = require('../controller/marketplaceController');
const schemas = require('../validators/schemas');

const router = express.Router();

// ─── Public (unauthenticated) endpoints ───────────────────────────────────────
// Billing webhook authenticity is established by gateway signature verification,
// NOT by a user session — it must bypass auth. Registered before the guard.
router.route('/billing/webhook').post(controller.billingWebhook);
// Affiliate click tracking + public marketplace catalog — no session required.
router.route('/referral/track').post(marketplace.trackReferral);
router.route('/marketplace/catalog').get(marketplace.catalog);
router.route('/marketplace/price').get(marketplace.priceSku);
// Public white-label branding lookup by domain (powers the branded login page).
router.route('/white-label/resolve').get(enterprise.resolveBranding);
// Public marketing data (pricing page, status page, case studies, API reference docs).
router.route('/public/plans').get(controller.publicPlans);
router.route('/public/status').get(controller.publicStatus);
router.route('/public/stats').get(controller.publicStats);
router.route('/public/case-studies').get(controller.publicCaseStudies);
router.route('/public/api-reference').get(controller.publicApiReference);

// ─── Tenant guard ──────────────────────────────────────────────────────────────
// Every route below requires an authenticated user with a validated, ACTIVE
// membership in the organization carried by their verified token. Organization
// identity is derived ONLY from the credential — never from client headers,
// query params or body. This is applied once here so no endpoint can omit it.
router.use(authMiddleware, requireOrganizationAccess);

// ─── Proxies ───────────────────────────────────────────────────────────────────
router.route('/proxies')
    .get(requirePermission('proxy:view'), controller.listProxies)
    .post(requirePermission('proxy:create'), validate(schemas.proxySchema), controller.createProxy);
router.route('/proxies/test').post(requirePermission('proxy:view'), validate(schemas.genericObjectSchema), controller.testProxy);
router.route('/proxies/export').post(requirePermission('proxy:view'), controller.exportProxies);
router.route('/proxies/:id')
    .get(requirePermission('proxy:view'), controller.getProxy)
    .put(requirePermission('proxy:update'), validate(schemas.genericObjectSchema), controller.updateProxy)
    .delete(requirePermission('proxy:delete'), controller.deleteProxy);
router.route('/proxies/:id/rotate').post(requirePermission('proxy:update'), controller.rotateProxy);
router.route('/proxies/:id/logs').get(requirePermission('proxy:view'), controller.getProxyLogs);

// ─── Presets ─────────────────────────────────────────────────────────────────
router.route('/presets')
    .get(requirePermission('preset:view'), controller.listPresets)
    .post(requirePermission('preset:create'), validate(schemas.presetSchema), controller.createPreset);
router.route('/presets/:id')
    .put(requirePermission('preset:update'), validate(schemas.genericObjectSchema), controller.updatePreset)
    .delete(requirePermission('preset:delete'), controller.deletePreset);

// ─── Usage ───────────────────────────────────────────────────────────────────
router.route('/usage/summary').get(requirePermission('usage:view'), controller.getUsageSummary);
router.route('/usage/history').get(requirePermission('usage:view'), controller.getUsageHistory);
router.route('/usage/realtime').get(requirePermission('usage:view'), controller.getRealtimeUsage);
router.route('/usage/stream').get(requirePermission('usage:view'), controller.streamUsage);
router.route('/billing/projected-overage').get(requirePermission('billing:view'), controller.getProjectedOverage);

// ─── Enterprise analytics + AI insights (org-scoped, real measurements) ─────────
router.route('/analytics/dashboard').get(requirePermission('usage:view'), analytics.dashboard);
router.route('/analytics/geo-heatmap').get(requirePermission('usage:view'), analytics.geoHeatmap);
router.route('/analytics/traffic-intelligence').get(requirePermission('usage:view'), analytics.trafficIntelligence);
router.route('/analytics/provider-mix').get(requirePermission('usage:view'), analytics.providerMix);
router.route('/analytics/forecast/bandwidth').get(requirePermission('usage:view'), analytics.bandwidthForecast);
router.route('/analytics/forecast/quota').get(requirePermission('usage:view'), analytics.quotaForecast);
router.route('/analytics/sla-risk').get(requirePermission('usage:view'), analytics.slaRisk);

// ─── Marketplace quotes + Partner (reseller) self-service ───────────────────────
router.route('/marketplace/quote').post(requirePermission('billing:view'), validate(schemas.genericObjectSchema), marketplace.createQuote);
router.route('/partner/me').get(marketplace.partnerMe);
router.route('/partner/customers').get(marketplace.partnerCustomers).post(validate(schemas.genericObjectSchema), marketplace.partnerAddCustomer);
router.route('/partner/sub-resellers').post(validate(schemas.genericObjectSchema), marketplace.partnerCreateSubReseller);
router.route('/partner/commissions').get(marketplace.partnerCommissions);
router.route('/partner/payouts/request').post(validate(schemas.genericObjectSchema), marketplace.partnerRequestPayout);

// ─── Trust / Privacy / KYC (customer self-service) ─────────────────────────────
router.route('/account/trust/status').get(requirePermission('security:view'), privacy.trustStatus);
router.route('/account/privacy/consent').post(requirePermission('security:update'), validate(schemas.genericObjectSchema), privacy.recordConsent);
router.route('/account/privacy/export').post(requirePermission('security:update'), privacy.requestExport);
router.route('/account/privacy/export/:id/download').get(requirePermission('security:view'), privacy.downloadExport);
router.route('/account/privacy/delete').post(requirePermission('security:update'), validate(schemas.genericObjectSchema), privacy.requestDelete);
router.route('/kyc/start').post(requirePermission('org:update'), validate(schemas.genericObjectSchema), privacy.startKyc);
router.route('/kyc/access-token').post(requirePermission('org:update'), privacy.kycAccessToken);

// ─── Enterprise (org-admin self-service: SSO/SCIM/RBAC/policies/SLA/white-label) ─
router.route('/enterprise/sso').get(requirePermission('org:view'), enterprise.getSso).put(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.upsertSso);
router.route('/enterprise/scim/tokens').get(requirePermission('org:view'), enterprise.listScimTokens).post(requirePermission('org:update'), enterprise.createScimToken);
router.route('/enterprise/scim/tokens/:id/revoke').post(requirePermission('org:update'), enterprise.revokeScimToken);
router.route('/enterprise/roles').get(requirePermission('org:view'), enterprise.listRoles).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.createRole);
router.route('/enterprise/policies').get(requirePermission('org:view'), enterprise.getPolicies).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.setPolicy);
router.route('/enterprise/org-units').get(requirePermission('org:view'), enterprise.listOrgUnits).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.createOrgUnit);
router.route('/enterprise/sla').get(requirePermission('org:view'), enterprise.getSla).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.setSla);
router.route('/enterprise/white-label').get(requirePermission('org:view'), enterprise.getWhiteLabel).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.upsertWhiteLabel);
router.route('/enterprise/white-label/domains').get(requirePermission('org:view'), enterprise.listWhiteLabelDomains).post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.addWhiteLabelDomain);
router.route('/enterprise/white-label/domains/:id/verify').post(requirePermission('org:update'), enterprise.verifyWhiteLabelDomain);
router.route('/enterprise/audit-export/:source').get(requirePermission('audit:view'), enterprise.exportAudit);
router.route('/enterprise/audit-sinks').post(requirePermission('org:update'), validate(schemas.genericObjectSchema), enterprise.addAuditSink);
router.route('/enterprise/audit-sinks/push').post(requirePermission('org:update'), enterprise.pushSiem);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.route('/analytics/bandwidth').get(requirePermission('analytics:view'), controller.getBandwidth);
router.route('/analytics/success-rate').get(requirePermission('analytics:view'), controller.getSuccessRate);
router.route('/analytics/top-countries').get(requirePermission('analytics:view'), controller.getTopCountries);
router.route('/analytics/top-domains').get(requirePermission('analytics:view'), controller.getTopDomains);
router.route('/analytics/latency-distribution').get(requirePermission('analytics:view'), controller.getLatencyDistribution);
router.route('/analytics/anomalies').get(requirePermission('analytics:view'), controller.getAnomalies);
router.route('/analytics/export').get(requirePermission('analytics:view'), controller.exportAnalytics);

// ─── Billing ─────────────────────────────────────────────────────────────────
router.route('/billing/subscription').get(requirePermission('billing:view'), controller.getSubscription);
router.route('/billing/plans').get(requirePermission('billing:view'), controller.getPlans);
router.route('/billing/invoices').get(requirePermission('billing:view'), controller.getInvoices);
router.route('/billing/invoices/:id').get(requirePermission('billing:view'), controller.getInvoice);
router.route('/billing/change-plan').post(requirePermission('billing:update'), validate(schemas.planChangeSchema), controller.changePlan);
router.route('/billing/activate').post(requirePermission('billing:update'), validate(schemas.planChangeSchema), controller.activatePlan);
router.route('/billing/credit')
    .get(requirePermission('billing:view'), controller.getCredit)
    .post(requirePermission('billing:update'), validate(schemas.creditPurchaseSchema), controller.buyCredit);
router.route('/billing/payment-methods')
    .get(requirePermission('billing:view'), controller.getPaymentMethods)
    .post(requirePermission('billing:update'), validate(schemas.paymentMethodSchema), controller.addPaymentMethod);
router.route('/billing/payment-methods/:id').delete(requirePermission('billing:update'), controller.deletePaymentMethod);
router.route('/billing/usage-forecast').get(requirePermission('billing:view'), controller.getUsageForecast);

// ─── Organisation ──────────────────────────────────────────────────────────────
router.route('/org').get(requirePermission('org:view'), controller.getOrganization).put(requirePermission('org:update'), validate(schemas.orgUpdateSchema), controller.updateOrganization);
router.route('/org/members').get(requirePermission('org:member:view'), controller.listOrgMembers);
router.route('/org/members/invite').post(requirePermission('org:member:invite'), validate(schemas.inviteUserSchema), controller.inviteOrgMember);
router.route('/org/members/:id/role').put(requirePermission('org:member:update'), validate(schemas.roleSchema), controller.updateOrgMemberRole);
router.route('/org/members/:id').delete(requirePermission('org:member:remove'), controller.deleteOrgMember);
router.route('/org/roles').get(requirePermission('org:view'), controller.listRoles);
router.route('/org/activity').get(requirePermission('org:view'), controller.getActivity);

// ─── API Keys ──────────────────────────────────────────────────────────────────
router.route('/api-keys').get(requirePermission('apikey:view'), controller.listApiKeys).post(requirePermission('apikey:create'), validate(schemas.apiKeySchema), controller.createApiKey);
router.route('/api-keys/:id').delete(requirePermission('apikey:revoke'), controller.deleteApiKey);
router.route('/api-keys/:id/revoke').post(requirePermission('apikey:revoke'), controller.revokeApiKey);

// ─── Security ────────────────────────────────────────────────────────────────
router.route('/security/sessions').get(requirePermission('security:view'), controller.listSessions);
router.route('/security/sessions/:id').delete(requirePermission('security:update'), controller.deleteSession);
router.route('/security/login-history').get(requirePermission('security:view'), controller.getLoginHistory);
router.route('/security/ip-allowlist').get(requirePermission('security:view'), controller.getIpAllowlist).post(requirePermission('security:update'), validate(schemas.ipSchema), controller.addIpAllowlist);
router.route('/security/ip-allowlist/:ip').delete(requirePermission('security:update'), controller.deleteIpAllowlist);

// ─── Notifications ─────────────────────────────────────────────────────────────
router.route('/notifications').get(requirePermission('notification:view'), controller.listNotifications);
router.route('/notifications/:id/read').put(requirePermission('notification:update'), controller.markNotificationRead);
router.route('/notifications/mark-all-read').post(requirePermission('notification:update'), controller.markAllNotificationsRead);

// ─── Audit logs ────────────────────────────────────────────────────────────────
router.route('/audit-logs').get(requirePermission('audit:view'), controller.listAuditLogs);
router.route('/audit-logs/export').get(requirePermission('audit:view'), controller.exportAuditLogs);

// ─── Support ───────────────────────────────────────────────────────────────────
router.route('/support/tickets').get(requirePermission('support:view'), controller.listTickets).post(requirePermission('support:view'), validate(schemas.ticketSchema), controller.createTicket);
router.route('/support/tickets/:id').get(requirePermission('support:view'), controller.getTicket);
router.route('/support/tickets/:id/reply').post(requirePermission('support:reply'), validate(schemas.ticketReplySchema), controller.replyTicket);
router.route('/support/tickets/:id/close').put(requirePermission('support:reply'), controller.closeTicket);

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.route('/dashboard/summary').get(requirePermission('dashboard:view'), controller.getDashboardSummary);

// ─── Exports / account ─────────────────────────────────────────────────────────
router.route('/exports/usage-logs').post(requirePermission('export:create'), controller.exportUsageLogs);
router.route('/exports/api-logs').post(requirePermission('export:create'), controller.exportApiLogs);
router.route('/exports/account-data').post(requirePermission('export:create'), controller.exportAccountData);
router.route('/account').delete(controller.deleteAccount);

router.route('/feature-flags/evaluate').get(controller.evaluateFeatureFlags);

module.exports = router;
