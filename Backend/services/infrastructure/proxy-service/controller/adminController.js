const adminService = require('../service/adminService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const wrap = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    dashboard: wrap(async (req, res) => sendSuccess(req, res, await adminService.getDashboard())),
    listTenants: wrap(async (req, res) => sendPaginated(req, res, await adminService.listTenants(req.query))),
    getTenant: wrap(async (req, res) => sendSuccess(req, res, await adminService.getTenant(req.params.orgId))),
    suspendTenant: wrap(async (req, res) => { await adminService.updateTenantStatus(req.params.orgId, 'suspended'); sendSuccess(req, res, null, 200); }),
    reactivateTenant: wrap(async (req, res) => { await adminService.updateTenantStatus(req.params.orgId, 'active'); sendSuccess(req, res, null, 200); }),
    overrideBandwidth: wrap(async (req, res) => sendSuccess(req, res, await adminService.overrideTenantLimits(req.params.orgId, { bandwidthLimitGb: req.body.bandwidthLimitGb }))),
    overrideCredits: wrap(async (req, res) => sendSuccess(req, res, await adminService.overrideTenantLimits(req.params.orgId, { credits: req.body.credits }))),
    listUsers: wrap(async (req, res) => sendPaginated(req, res, await adminService.listPlatformUsers(req.query))),
    banUser: wrap(async (req, res) => { await adminService.updatePlatformUserStatus(req.params.id, 'banned'); sendSuccess(req, res, null, 200); }),
    suspendUser: wrap(async (req, res) => { await adminService.updatePlatformUserStatus(req.params.id, 'suspended'); sendSuccess(req, res, null, 200); }),
    reactivateUser: wrap(async (req, res) => { await adminService.updatePlatformUserStatus(req.params.id, 'active'); sendSuccess(req, res, null, 200); }),
    listProviders: wrap(async (req, res) => sendSuccess(req, res, await adminService.listProviders())),
    getProvider: wrap(async (req, res) => sendSuccess(req, res, await adminService.getProvider(req.params.id))),
    createProvider: wrap(async (req, res) => sendSuccess(req, res, await adminService.createProvider(req.body), 201)),
    updateProvider: wrap(async (req, res) => sendSuccess(req, res, await adminService.updateProvider(req.params.id, req.body))),
    deleteProvider: wrap(async (req, res) => { await adminService.deleteProvider(req.params.id); sendSuccess(req, res, null, 200); }),
    getProviderHealth: wrap(async (req, res) => sendSuccess(req, res, await adminService.getProviderHealth(req.params.id))),
    getProviderIncidents: wrap(async (req, res) => sendSuccess(req, res, await adminService.getProviderIncidents(req.params.id))),
    listRoutingRules: wrap(async (req, res) => sendSuccess(req, res, await adminService.listRoutingRules())),
    createRoutingRule: wrap(async (req, res) => sendSuccess(req, res, await adminService.createRoutingRule(req.body), 201)),
    updateRoutingRule: wrap(async (req, res) => sendSuccess(req, res, await adminService.updateRoutingRule(req.params.id, req.body))),
    deleteRoutingRule: wrap(async (req, res) => { await adminService.deleteRoutingRule(req.params.id); sendSuccess(req, res, null, 200); }),
    reorderRoutingRules: wrap(async (req, res) => sendSuccess(req, res, await adminService.reorderRoutingRules(req.body), 200)),
    getSystemServices: wrap(async (req, res) => sendSuccess(req, res, await adminService.getSystemServices())),
    getSystemMetrics: wrap(async (req, res) => sendSuccess(req, res, await adminService.getSystemMetrics())),
    listAbuseLogs: wrap(async (req, res) => sendPaginated(req, res, await adminService.listAbuseLogs(req.query))),
    resolveAbuseLog: wrap(async (req, res) => { await adminService.resolveAbuseLog(req.params.id); sendSuccess(req, res, null, 200); }),
    getRateLimits: wrap(async (req, res) => sendSuccess(req, res, await adminService.getRateLimits())),
    updateRateLimit: wrap(async (req, res) => sendSuccess(req, res, await adminService.updateRateLimit(req.params.id, req.body))),
    getRevenueSummary: wrap(async (req, res) => sendSuccess(req, res, await adminService.getRevenueSummary(req.query.period))),
    getCohortRetention: wrap(async (req, res) => sendSuccess(req, res, await adminService.getCohortRetention())),
    getFeatureFlags: wrap(async (req, res) => sendSuccess(req, res, await adminService.getFeatureFlags())),
    updateFeatureFlag: wrap(async (req, res) => sendSuccess(req, res, await adminService.updateFeatureFlag(req.params.key, req.body))),
    getAuditLogs: wrap(async (req, res) => sendPaginated(req, res, await adminService.getAuditLogs(req.query))),
    exportAuditLogs: wrap(async (req, res) => sendSuccess(req, res, await adminService.exportAuditLogs())),
};