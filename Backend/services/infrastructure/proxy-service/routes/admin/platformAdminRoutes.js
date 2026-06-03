const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { requirePlatformAdmin } = require('../../middleware/permissionMiddleware');
const validate = require('../../middleware/validate');
const schemas = require('../../validators/schemas');
const adminController = require('../../controller/adminController');
const orchestration = require('../../controller/orchestrationController');
const trust = require('../../controller/trustController');
const edge = require('../../controller/edgeController');
const intel = require('../../controller/intelligenceController');
const finance = require('../../controller/financeController');
const marketplace = require('../../controller/marketplaceController');

const router = express.Router();

router.use(authMiddleware, requirePlatformAdmin);

// ─── Billing administration (subscriptions + plans) ────────────────────────────
router.route('/billing/subscriptions').get(adminController.listSubscriptions);
router.route('/billing/subscriptions/summary').get(adminController.subscriptionSummary);
router.route('/billing/subscriptions/:orgId/change-plan').post(validate(schemas.planChangeSchema), adminController.changeOrgPlan);
router.route('/billing/subscriptions/:orgId/cancel').post(adminController.cancelOrgSubscription);
router.route('/billing/plans')
    .get(adminController.listPlans)
    .post(validate(schemas.genericObjectSchema), adminController.createPlan);
router.route('/billing/plans/:id')
    .patch(validate(schemas.genericObjectSchema), adminController.updatePlan)
    .delete(adminController.deletePlan);

// ─── Trust & Safety / compliance control plane ─────────────────────────────────
router.route('/trust/cases').get(trust.listCases).post(validate(schemas.genericObjectSchema), trust.createCase);
router.route('/trust/cases/:id/history').get(trust.caseHistory);
router.route('/trust/cases/:id/transition').post(validate(schemas.genericObjectSchema), trust.transitionCase);
router.route('/trust/cases/:id/assign').post(validate(schemas.genericObjectSchema), trust.assignCase);
router.route('/trust/cases/:id/act').post(validate(schemas.genericObjectSchema), trust.actOnCase);
router.route('/trust/kyc').get(trust.listKyc);
router.route('/trust/kyc/:id/decide').post(validate(schemas.genericObjectSchema), trust.decideKyc);
router.route('/trust/enforcement/:orgId').get(trust.listEnforcement).post(validate(schemas.genericObjectSchema), trust.applyEnforcement);
router.route('/trust/enforcement/action/:id/revoke').post(trust.revokeEnforcement);
router.route('/trust/risk/:orgId').post(trust.riskForOrg);
router.route('/trust/risk/:orgId/history').get(trust.riskHistory);
router.route('/trust/destination-intel').get(trust.listDestIntel);
router.route('/trust/destination-intel/refresh').post(trust.refreshDestIntel);
router.route('/trust/compliance-report').get(trust.complianceReport);

// ─── Provider orchestration control plane ──────────────────────────────────────
router.route('/orchestration/providers').get(orchestration.providerStates);
router.route('/orchestration/providers/:id/credentials').post(validate(schemas.genericObjectSchema), orchestration.setCredentials);
router.route('/orchestration/config-export').get(orchestration.exportConfigs);
router.route('/orchestration/routing-policies').get(orchestration.listPolicies).post(validate(schemas.genericObjectSchema), orchestration.upsertPolicy);
router.route('/orchestration/ip-intelligence').get(orchestration.ipIntelligence);
router.route('/orchestration/geo-coverage').get(orchestration.geoCoverage);
router.route('/orchestration/sessions').get(orchestration.activeSessions);
router.route('/orchestration/ban-analytics').get(orchestration.banAnalytics);

// ─── Global edge network / PoPs ────────────────────────────────────────────────
router.route('/edge/regions').get(edge.listRegions).post(validate(schemas.genericObjectSchema), edge.upsertRegion);
router.route('/edge/regions/pick').get(edge.pickRegion);
router.route('/edge/regions/:code/health').post(validate(schemas.genericObjectSchema), edge.regionHealth);

// ─── ASN intelligence ───────────────────────────────────────────────────────────
router.route('/edge/asn').get(edge.listAsn).post(validate(schemas.genericObjectSchema), edge.upsertAsn);
router.route('/edge/asn/refresh').post(edge.refreshAsn);
router.route('/edge/asn/:asn').get(edge.getAsn);

// ─── Dedicated / owned-IP pools + allocations ─────────────────────────────────────
router.route('/edge/pools').get(edge.listPools).post(validate(schemas.genericObjectSchema), edge.createPool);
router.route('/edge/pools/:id/ips').post(validate(schemas.genericObjectSchema), edge.addIPs);
router.route('/edge/pools/allocate').post(validate(schemas.genericObjectSchema), edge.allocate);
router.route('/edge/pools/deallocate').post(validate(schemas.genericObjectSchema), edge.deallocate);
router.route('/edge/pools/org/:orgId').get(edge.orgPool);

// ─── AI network intelligence (models, routing brain, anomalies, forecasts) ──────
router.route('/intelligence/models').get(intel.listModels);
router.route('/intelligence/models/:name/metrics').get(intel.modelMetrics);
router.route('/intelligence/models/:name/promote').post(validate(schemas.genericObjectSchema), intel.promoteModel);
router.route('/intelligence/ban/train').post(intel.trainBan);
router.route('/intelligence/ban/score').post(intel.scoreBanRoutes);
router.route('/intelligence/ban/probabilities').get(intel.banProbabilities);
router.route('/intelligence/routing/weights').get(intel.routeWeights).post(intel.recomputeWeights);
router.route('/intelligence/routing/predictive-failover').post(intel.predictiveFailover);
router.route('/intelligence/features/refresh').post(intel.refreshFeatures);
router.route('/intelligence/features/providers').get(intel.providerFeatures);
router.route('/intelligence/features/asn').get(intel.asnQuality);
router.route('/intelligence/anomalies').get(intel.listAnomalies);
router.route('/intelligence/anomalies/sweep').post(intel.sweepAnomalies);
router.route('/intelligence/anomalies/:id/resolve').put(validate(schemas.genericObjectSchema), intel.resolveAnomaly);
router.route('/intelligence/forecasts').get(intel.latestForecasts);
router.route('/intelligence/forecasts/run').post(intel.runForecasts);
router.route('/intelligence/forecasts/platform').get(intel.platformForecast);
router.route('/intelligence/forecasts/provider-cost').get(intel.providerCostForecast);
router.route('/intelligence/cost-optimization').get(intel.costOptimization);
router.route('/intelligence/sla-risk').get(intel.slaRisk);

// ─── Financial operations + revenue intelligence ───────────────────────────────
router.route('/finance/dashboard').get(finance.dashboard);
router.route('/finance/reconciliation/usage').post(finance.runUsageReconciliation);
router.route('/finance/reconciliation/runs').get(finance.listReconciliationRuns);
router.route('/finance/reconciliation/runs/:runId/discrepancies').get(finance.listDiscrepancies);
router.route('/finance/reconciliation/provider').post(validate(schemas.genericObjectSchema), finance.reconcileProviderInvoice);
router.route('/finance/provider-costs').get(finance.listProviderCostModels).post(validate(schemas.genericObjectSchema), finance.upsertProviderCostModel);
router.route('/finance/provider-contracts').post(validate(schemas.genericObjectSchema), finance.upsertProviderContract);
router.route('/finance/provider-costs/preview').get(finance.providerCostPreview);
router.route('/finance/infra-costs').post(validate(schemas.genericObjectSchema), finance.ingestInfraCost);
router.route('/finance/infra-costs/attribute').post(finance.attributeInfra);
router.route('/finance/profitability/snapshot').post(finance.snapshotProfitability);
router.route('/finance/profitability/heatmap').get(finance.marginHeatmap);
router.route('/finance/tax/preview').get(finance.taxPreview);
router.route('/finance/tax/rates').post(validate(schemas.genericObjectSchema), finance.upsertTaxRate);
router.route('/finance/ledger/:orgId').get(finance.ledgerBalance);
router.route('/finance/ledger/:orgId/credit').post(validate(schemas.genericObjectSchema), finance.addCredit);
router.route('/finance/ledger/:orgId/adjust').post(validate(schemas.genericObjectSchema), finance.adjustLedger);
router.route('/finance/refunds').get(finance.listRefunds).post(validate(schemas.genericObjectSchema), finance.requestRefund);
router.route('/finance/refunds/:id/decide').post(validate(schemas.genericObjectSchema), finance.decideRefund);
router.route('/finance/erp-export').get(finance.erpExport);
router.route('/finance/forecast/provider-spend').get(finance.forecastProviderSpend);

// ─── Marketplace + reseller + affiliate + channel ──────────────────────────────
router.route('/marketplace/resellers').get(marketplace.adminListResellers).post(validate(schemas.genericObjectSchema), marketplace.adminCreateReseller);
router.route('/marketplace/resellers/:id/approve').post(validate(schemas.genericObjectSchema), marketplace.adminApproveReseller);
router.route('/marketplace/resellers/:id/risk').get(marketplace.adminResellerRisk);
router.route('/marketplace/resellers/:id/contract').post(validate(schemas.genericObjectSchema), marketplace.adminSetContract);
router.route('/marketplace/products').post(validate(schemas.genericObjectSchema), marketplace.adminUpsertProduct);
router.route('/marketplace/promotions').post(validate(schemas.genericObjectSchema), marketplace.adminUpsertPromotion);
router.route('/marketplace/affiliates').post(validate(schemas.genericObjectSchema), marketplace.adminCreateAffiliate);
router.route('/marketplace/payouts').get(marketplace.adminListPayouts);
router.route('/marketplace/payouts/:id/approve').post(marketplace.adminApprovePayout);
router.route('/marketplace/payouts/process').post(marketplace.adminProcessPayouts);
router.route('/marketplace/channel/leaderboard').get(marketplace.adminLeaderboard);
router.route('/marketplace/channel/revenue').get(marketplace.adminChannelRevenue);

router.route('/dashboard').get(adminController.dashboard);
router.route('/tenants').get(adminController.listTenants);
router.route('/tenants/:orgId').get(adminController.getTenant);
router.route('/tenants/:orgId/suspend').put(adminController.suspendTenant);
router.route('/tenants/:orgId/reactivate').put(adminController.reactivateTenant);
router.route('/tenants/:orgId/override-bandwidth').post(validate(schemas.genericObjectSchema), adminController.overrideBandwidth);
router.route('/tenants/:orgId/override-credits').post(validate(schemas.genericObjectSchema), adminController.overrideCredits);

router.route('/users').get(adminController.listUsers);
router.route('/users/:id/ban').put(adminController.banUser);
router.route('/users/:id/suspend').put(adminController.suspendUser);
router.route('/users/:id/reactivate').put(adminController.reactivateUser);

router.route('/providers').get(adminController.listProviders).post(validate(schemas.genericObjectSchema), adminController.createProvider);
router.route('/providers/:id').get(adminController.getProvider).put(validate(schemas.genericObjectSchema), adminController.updateProvider).delete(adminController.deleteProvider);
router.route('/providers/:id/health').get(adminController.getProviderHealth);
router.route('/providers/:id/incidents').get(adminController.getProviderIncidents);

router.route('/routing-rules').get(adminController.listRoutingRules).post(validate(schemas.genericObjectSchema), adminController.createRoutingRule);
router.route('/routing-rules/:id').put(validate(schemas.genericObjectSchema), adminController.updateRoutingRule).delete(adminController.deleteRoutingRule);
router.route('/routing-rules/reorder').post(validate(schemas.genericObjectSchema), adminController.reorderRoutingRules);

router.route('/system/services').get(adminController.getSystemServices);
router.route('/system/metrics').get(adminController.getSystemMetrics);

router.route('/abuse/logs').get(adminController.listAbuseLogs);
router.route('/abuse/logs/:id/resolve').put(adminController.resolveAbuseLog);
router.route('/abuse/rate-limits').get(adminController.getRateLimits);
router.route('/abuse/rate-limits/:id').put(validate(schemas.genericObjectSchema), adminController.updateRateLimit);

router.route('/revenue/summary').get(adminController.getRevenueSummary);
router.route('/revenue/cohort-retention').get(adminController.getCohortRetention);

router.route('/feature-flags').get(adminController.getFeatureFlags);
router.route('/feature-flags/:key').put(validate(schemas.genericObjectSchema), adminController.updateFeatureFlag);

router.route('/audit-logs').get(adminController.getAuditLogs);
router.route('/audit-logs/export').post(adminController.exportAuditLogs);

module.exports = router;