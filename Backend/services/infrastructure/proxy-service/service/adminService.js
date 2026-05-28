const store = require('./platformStore');
const { AppError } = require('../utils/errors');

const getDashboard = async () => ({
    totalTenants: (await store.getCollection('organizations')).length,
    totalUsers: (await store.getCollection('users')).length,
    providers: (await store.getCollection('providers')).length,
    openIncidents: (await store.getCollection('providerIncidents')).filter((item) => item.status === 'open').length,
});

const listTenants = async (query) => store.paginate(await store.getCollection('organizations'), query.page, query.pageSize);
const getTenant = async (orgId) => {
    const organization = await store.getById('organizations', orgId);
    if (!organization) {
        throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }
    return organization;
};

const updateTenantStatus = async (orgId, status) => {
    const organization = await store.update('organizations', orgId, { status });
    if (!organization) {
        throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }
    return organization;
};

const overrideTenantLimits = async (orgId, payload) => {
    const organization = await store.update('organizations', orgId, payload);
    if (!organization) {
        throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }
    return organization;
};

const listPlatformUsers = async (query) => store.paginate(await store.getCollection('users'), query.page, query.pageSize);
const updatePlatformUserStatus = async (id, status) => {
    const user = await store.update('users', id, { status });
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
};

const listProviders = () => store.getCollection('providers');
const getProvider = async (id) => ({
    provider: await store.getById('providers', id),
    healthHistory: (await store.getCollection('providerHealth')).filter((item) => item.providerId === id),
});
const createProvider = (payload) => store.insert('providers', payload);
const updateProvider = async (id, payload) => {
    const provider = await store.update('providers', id, payload);
    if (!provider) {
        throw new AppError('PROVIDER_NOT_FOUND', 'Provider not found', 404);
    }
    return provider;
};
const deleteProvider = async (id) => {
    const removed = await store.remove('providers', id);
    if (!removed) {
        throw new AppError('PROVIDER_NOT_FOUND', 'Provider not found', 404);
    }
};

const getProviderHealth = async (id) => (await store.getCollection('providerHealth')).filter((item) => item.providerId === id);
const getProviderIncidents = async (id) => (await store.getCollection('providerIncidents')).filter((item) => item.providerId === id);

const listRoutingRules = () => store.getCollection('routingRules');
const createRoutingRule = (payload) => store.insert('routingRules', payload);
const updateRoutingRule = async (id, payload) => {
    const rule = await store.update('routingRules', id, payload);
    if (!rule) {
        throw new AppError('ROUTING_RULE_NOT_FOUND', 'Routing rule not found', 404);
    }
    return rule;
};
const deleteRoutingRule = async (id) => {
    const removed = await store.remove('routingRules', id);
    if (!removed) {
        throw new AppError('ROUTING_RULE_NOT_FOUND', 'Routing rule not found', 404);
    }
};
const reorderRoutingRules = async (payload) => payload;

const getSystemServices = async () => [
    { name: 'api', status: 'healthy' },
    { name: 'redis', status: 'healthy' },
    { name: 'queue', status: 'healthy' },
];

const getSystemMetrics = async () => ({ cpu: 24, memory: 61, rps: 328, errorRate: 0.4 });
const listAbuseLogs = async (query) => store.paginate(await store.getCollection('abuseLogs'), query.page, query.pageSize);
const resolveAbuseLog = async (id) => {
    const abuseLog = await store.update('abuseLogs', id, { resolved: true });
    if (!abuseLog) {
        throw new AppError('ABUSE_LOG_NOT_FOUND', 'Abuse log not found', 404);
    }
};
const getRateLimits = () => store.getCollection('rateLimits');
const updateRateLimit = async (id, payload) => {
    const rateLimit = await store.update('rateLimits', id, payload);
    if (!rateLimit) {
        throw new AppError('RATE_LIMIT_NOT_FOUND', 'Rate limit config not found', 404);
    }
    return rateLimit;
};

const getRevenueSummary = async () => ({ mrr: 189400, arr: 2272800, churn: 1.8, ltv: 8420, arpu: 921 });
const getCohortRetention = async () => ({ cohorts: [{ month: '2026-01', retention: [100, 94, 90] }] });
const getFeatureFlags = () => store.getCollection('featureFlags');
const updateFeatureFlag = async (key, payload) => {
    const flag = await store.update('featureFlags', key, payload);
    if (!flag) {
        throw new AppError('FEATURE_FLAG_NOT_FOUND', 'Feature flag not found', 404);
    }
    return flag;
};
const getAuditLogs = async (query) => store.paginate(await store.getCollection('auditLogs'), query.page, query.pageSize);
const exportAuditLogs = async () => ({ downloadUrl: '/downloads/admin-audit-logs.csv' });

module.exports = {
    getDashboard,
    listTenants,
    getTenant,
    updateTenantStatus,
    overrideTenantLimits,
    listPlatformUsers,
    updatePlatformUserStatus,
    listProviders,
    getProvider,
    createProvider,
    updateProvider,
    deleteProvider,
    getProviderHealth,
    getProviderIncidents,
    listRoutingRules,
    createRoutingRule,
    updateRoutingRule,
    deleteRoutingRule,
    reorderRoutingRules,
    getSystemServices,
    getSystemMetrics,
    listAbuseLogs,
    resolveAbuseLog,
    getRateLimits,
    updateRateLimit,
    getRevenueSummary,
    getCohortRetention,
    getFeatureFlags,
    updateFeatureFlag,
    getAuditLogs,
    exportAuditLogs,
};