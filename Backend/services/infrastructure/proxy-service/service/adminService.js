const store = require('./platformStore');
const db = require('../models');
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

// ─── Billing administration (platform-admin) ──────────────────────────────────
const _orgNameMap = async () => {
    const orgs = await store.getCollection('organizations');
    return orgs.reduce((m, o) => { m[o.id] = o.name; return m; }, {});
};

const listSubscriptions = async (query = {}) => {
    const [subs, orgMap, plans] = await Promise.all([
        store.getCollection('subscriptions'),
        _orgNameMap(),
        store.getCollection('plans'),
    ]);
    const planName = {};
    plans.forEach((p) => { planName[p.slug] = p.name; planName[p.id] = p.name; });
    let rows = subs.map((s) => ({
        id: s.id,
        orgId: s.orgId,
        orgName: orgMap[s.orgId] || s.orgId,
        planSlug: s.planSlug,
        planName: planName[s.planSlug] || planName[s.planId] || s.planSlug,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        createdAt: s.createdAt,
    }));
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    if (query.q) {
        const q = String(query.q).toLowerCase();
        rows = rows.filter((r) => (r.orgName || '').toLowerCase().includes(q) || (r.planSlug || '').toLowerCase().includes(q));
    }
    rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return store.paginate(rows, query.page, query.pageSize);
};

const getSubscriptionSummary = async () => {
    const [subs, plans] = await Promise.all([store.getCollection('subscriptions'), store.getCollection('plans')]);
    const priceBySlug = {};
    plans.forEach((p) => { priceBySlug[p.slug] = Number(p.monthlyPrice) || 0; });
    const byStatus = {};
    let mrr = 0;
    subs.forEach((s) => {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        if (s.status === 'active') mrr += priceBySlug[s.planSlug] || 0;
    });
    return { total: subs.length, byStatus, activeMrr: Math.round(mrr * 100) / 100 };
};

// Per-customer (org) revenue breakdown: monthly recurring (active plan price),
// PAYG prepaid credit purchased, and lifetime collected (paid invoices + credit),
// plus platform-wide totals. Powers the "Revenue by Customer" admin view.
const getRevenueByCustomer = async () => {
    const [orgs, subs, plans] = await Promise.all([
        store.getCollection('organizations'),
        store.getCollection('subscriptions'),
        store.getCollection('plans'),
    ]);
    const priceBySlug = {};
    plans.forEach((p) => { priceBySlug[p.slug] = Number(p.monthlyPrice) || 0; });
    const subByOrg = {};
    subs.forEach((s) => { if (!subByOrg[s.orgId]) subByOrg[s.orgId] = s; });

    const sumByOrg = async (sql) => {
        try {
            const [rows] = await db.sequelize.query(sql);
            const m = {};
            rows.forEach((r) => { m[r.org_id] = Number(r.amt) || 0; });
            return m;
        } catch (_) { return {}; }
    };
    const creditByOrg = await sumByOrg(
        `SELECT org_id, COALESCE(SUM(amount), 0) AS amt FROM credit_ledger WHERE entry_type = 'credit' GROUP BY org_id`);
    const paidByOrg = await sumByOrg(
        `SELECT org_id, COALESCE(SUM(COALESCE(total, amount)), 0) AS amt FROM invoices WHERE status = 'paid' GROUP BY org_id`);

    let customers = orgs.map((o) => {
        const sub = subByOrg[o.id];
        const planSlug = (sub && sub.planSlug) || o.planSlug || 'none';
        const status = (sub && sub.status) || 'none';
        const mrr = status === 'active' && planSlug !== 'pay-as-you-go' ? (priceBySlug[planSlug] || 0) : 0;
        const creditPurchased = creditByOrg[o.id] || 0;
        const lifetimeRevenue = (paidByOrg[o.id] || 0) + creditPurchased;
        return {
            orgId: o.id,
            orgName: o.name,
            planSlug,
            status,
            mrr: Math.round(mrr * 100) / 100,
            creditPurchased: Math.round(creditPurchased * 100) / 100,
            lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
        };
    });
    // Only paying / billable customers (drop empty placeholder orgs).
    customers = customers
        .filter((c) => c.mrr > 0 || c.creditPurchased > 0 || c.lifetimeRevenue > 0 || c.status === 'active' || c.status === 'trialing')
        .sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue || b.mrr - a.mrr);

    const totals = customers.reduce((t, c) => ({
        mrr: t.mrr + c.mrr,
        creditRevenue: t.creditRevenue + c.creditPurchased,
        lifetimeRevenue: t.lifetimeRevenue + c.lifetimeRevenue,
        customers: t.customers + 1,
    }), { mrr: 0, creditRevenue: 0, lifetimeRevenue: 0, customers: 0 });
    totals.mrr = Math.round(totals.mrr * 100) / 100;
    totals.creditRevenue = Math.round(totals.creditRevenue * 100) / 100;
    totals.lifetimeRevenue = Math.round(totals.lifetimeRevenue * 100) / 100;
    totals.arr = Math.round(totals.mrr * 12 * 100) / 100;

    return { customers, totals };
};

const listAdminPlans = async () => store.getCollection('plans');

const createPlan = async (payload) => {
    if (!payload || !payload.name) throw new AppError('VALIDATION', 'Plan name is required', 400);
    return store.insert('plans', {
        name: payload.name,
        monthlyPrice: Number(payload.monthlyPrice) || 0,
        bandwidthLimitGb: Number(payload.bandwidthLimitGb) || 0,
        features: Array.isArray(payload.features) ? payload.features : [],
    });
};

const updatePlan = async (id, payload = {}) => {
    const update = {};
    if (payload.name !== undefined) update.name = payload.name;
    if (payload.monthlyPrice !== undefined) update.monthlyPrice = Number(payload.monthlyPrice);
    if (payload.bandwidthLimitGb !== undefined) update.bandwidthLimitGb = Number(payload.bandwidthLimitGb);
    if (payload.features !== undefined) update.features = Array.isArray(payload.features) ? payload.features : [];
    const plan = await store.update('plans', id, update);
    if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
    return plan;
};

const deletePlan = async (id) => {
    const ok = await store.remove('plans', id);
    if (!ok) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
};

const _firstSub = async (orgId) => {
    const subs = await store.getCollection('subscriptions', orgId);
    return subs[0] || null;
};

const adminChangeOrgPlan = async (orgId, planSlug, actorId) => {
    const sub = await _firstSub(orgId);
    if (!sub) throw new AppError('NO_SUBSCRIPTION', 'Organization has no subscription', 404);
    const plan = (await store.getCollection('plans')).find((p) => p.slug === planSlug);
    if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
    await store.update('subscriptions', sub.id, { planSlug, status: 'active' }, orgId);
    await store.update('organizations', orgId, { planSlug, bandwidthLimitGb: plan.bandwidthLimitGb });
    await store.createAuditLog({ orgId, actorUserId: actorId, action: 'billing.admin.change_plan', entityType: 'subscription', entityId: sub.id, details: { planSlug } });
    return _firstSub(orgId);
};

const adminCancelOrgSubscription = async (orgId, actorId) => {
    const sub = await _firstSub(orgId);
    if (!sub) throw new AppError('NO_SUBSCRIPTION', 'Organization has no subscription', 404);
    await store.update('subscriptions', sub.id, { status: 'cancelled', cancelAtPeriodEnd: true }, orgId);
    await store.createAuditLog({ orgId, actorUserId: actorId, action: 'billing.admin.cancel', entityType: 'subscription', entityId: sub.id, details: {} });
    return _firstSub(orgId);
};

// ── Pending bank/wire orders (offline settlement) ──────────────────────────────
const PENDING_STATUSES = new Set(['pending', 'unpaid', 'open', 'due']);

// Method isn't persisted on the invoice; infer it for display (bank ~7d due, wire ~Net 30).
const estimateMethod = (issuedAt, dueAt) => {
    if (!issuedAt || !dueAt) return 'bank';
    const days = (new Date(dueAt).getTime() - new Date(issuedAt).getTime()) / (24 * 60 * 60 * 1000);
    return days >= 20 ? 'wire' : 'bank';
};

const listPendingOrders = async () => {
    const [invoices, orgs, subs] = await Promise.all([
        store.getCollection('invoices'),
        store.getCollection('organizations'),
        store.getCollection('subscriptions'),
    ]);
    const orgById = new Map(orgs.map((o) => [o.id, o]));
    const subById = new Map(subs.map((s) => [String(s.id), s]));
    return invoices
        .filter((inv) => PENDING_STATUSES.has(String(inv.status || '').toLowerCase()))
        .map((inv) => {
            const org = orgById.get(inv.orgId);
            const sub = subById.get(String(inv.subscriptionId));
            return {
                invoiceId: inv.id,
                orgId: inv.orgId,
                orgName: (org && org.name) || inv.orgId,
                planSlug: (sub && sub.planSlug) || (org && org.planSlug) || null,
                amount: inv.amount,
                total: inv.total,
                status: inv.status,
                method: estimateMethod(inv.issuedAt, inv.dueAt),
                issuedAt: inv.issuedAt,
                dueAt: inv.dueAt,
            };
        })
        .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
};

// Mark a pending order's invoice PAID (funds received) and activate the org's
// subscription. Idempotent — a no-op if already paid.
const markOrderPaid = async (invoiceId) => {
    const invoice = await store.getById('invoices', invoiceId);
    if (!invoice) throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 404);
    if (String(invoice.status).toLowerCase() === 'paid') {
        return { invoiceId, status: 'paid', alreadyPaid: true, orgId: invoice.orgId };
    }

    await store.update('invoices', invoiceId, { status: 'paid' }, invoice.orgId);

    // Activate the linked subscription WITHOUT creating a second invoice (this one IS it).
    const sub = await store.getById('subscriptions', invoice.subscriptionId, invoice.orgId);
    const planSlug = sub && sub.planSlug;
    let activated = false;
    if (planSlug && planSlug !== 'pay-as-you-go') {
        try {
            const billingService = require('./billingService');
            await billingService.activateSubscription(
                { orgId: invoice.orgId, userId: invoice.userId },
                planSlug,
                { skipInvoice: true },
            );
            activated = true;
        } catch (e) { /* invoice still marked paid; activation is best-effort */ }
    }
    return { invoiceId, status: 'paid', activated, orgId: invoice.orgId, planSlug: planSlug || null };
};

module.exports = {
    getDashboard,
    listPendingOrders,
    markOrderPaid,
    listSubscriptions,
    getSubscriptionSummary,
    getRevenueByCustomer,
    listAdminPlans,
    createPlan,
    updatePlan,
    deletePlan,
    adminChangeOrgPlan,
    adminCancelOrgSubscription,
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