const store = require('./platformStore');
const authService = require('./authService');
const { AppError } = require('../utils/errors');

const healthStatus = ({ successRate, latency }) => {
    if (successRate < 50 || latency >= 2000) {
        return 'down';
    }
    if (successRate > 95 && latency < 500) {
        return 'healthy';
    }
    if (successRate > 80 || latency < 2000) {
        return 'degraded';
    }
    if (successRate > 50) {
        return 'critical';
    }
    return 'down';
};

const listProxies = async (auth, query) => {
    const proxies = await store.getCollection('proxies', auth.orgId);
    return store.paginate(proxies, query.page, query.pageSize);
};

const getProxy = async (auth, id) => {
    const proxy = await store.getById('proxies', id, auth.orgId);
    if (!proxy) {
        throw new AppError('PROXY_NOT_FOUND', 'Proxy not found', 404);
    }
    return proxy;
};

const createProxy = async (auth, payload) => {
    const proxy = await store.insert('proxies', {
        orgId: auth.orgId,
        ...payload,
        status: payload.status || 'healthy',
        bandwidthUsedGb: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    await store.createAuditLog({ orgId: auth.orgId, actorUserId: auth.userId, action: 'proxy.created', entityType: 'proxy', entityId: proxy.id, createdAt: new Date().toISOString(), details: payload });
    return proxy;
};

const updateProxy = async (auth, id, payload) => {
    const proxy = await store.update('proxies', id, payload, auth.orgId);
    if (!proxy) {
        throw new AppError('PROXY_NOT_FOUND', 'Proxy not found', 404);
    }
    await store.createAuditLog({ orgId: auth.orgId, actorUserId: auth.userId, action: 'proxy.updated', entityType: 'proxy', entityId: id, createdAt: new Date().toISOString(), details: payload });
    return proxy;
};

const deleteProxy = async (auth, id) => {
    const removed = await store.remove('proxies', id, auth.orgId);
    if (!removed) {
        throw new AppError('PROXY_NOT_FOUND', 'Proxy not found', 404);
    }
    await store.createAuditLog({ orgId: auth.orgId, actorUserId: auth.userId, action: 'proxy.deleted', entityType: 'proxy', entityId: id, createdAt: new Date().toISOString(), details: {} });
};

const rotateProxy = async (auth, id) => {
    const port = 9000 + Math.floor(Math.random() * 500);
    const proxy = await updateProxy(auth, id, {
        host: `rotated-${Date.now()}.baalvion.net`,
        port,
    });
    authService.issueEvent('proxy.health.changed', auth.orgId, { proxyId: id, host: proxy.host, port });
    return proxy;
};

const getProxyLogs = async (auth, id, query) => {
    const logs = (await store.getCollection('proxyLogs', auth.orgId)).filter((log) => log.proxyId === id);
    return store.paginate(logs, query.page, query.pageSize);
};

const testProxy = async (auth, payload) => {
    const latency = 120 + Math.floor(Math.random() * 250);
    return {
        statusCode: 200,
        latency,
        ip: payload.ip || '198.51.100.10',
        location: `${payload.country || 'US'}-edge`,
        headers: {
            'x-baalvion-proxy': 'ok',
        },
    };
};

const csvCell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const exportProxies = async (auth) => {
    const rows = auth ? await store.getCollection('proxies', auth.orgId) : [];
    const header = ['id', 'name', 'host', 'port', 'protocol', 'country', 'type', 'status', 'bandwidthUsedGb', 'createdAt'];
    const csv = [
        header.join(','),
        ...rows.map((p) => [p.id, p.name, p.host, p.port, p.protocol, p.country, p.type, p.status, p.bandwidthUsedGb, p.createdAt].map(csvCell).join(',')),
    ].join('\n');
    return { filename: `proxies-${auth ? auth.orgId : 'export'}.csv`, contentType: 'text/csv', content: csv };
};

const listPresets = async (auth) => store.getCollection('presets', auth.orgId);

const createPreset = async (auth, payload) => store.insert('presets', { orgId: auth.orgId, ...payload, createdAt: new Date().toISOString() });

const updatePreset = async (auth, id, payload) => {
    const preset = await store.update('presets', id, payload, auth.orgId);
    if (!preset) {
        throw new AppError('PRESET_NOT_FOUND', 'Preset not found', 404);
    }
    return preset;
};

const deletePreset = async (auth, id) => {
    const removed = await store.remove('presets', id, auth.orgId);
    if (!removed) {
        throw new AppError('PRESET_NOT_FOUND', 'Preset not found', 404);
    }
};

module.exports = {
    healthStatus,
    listProxies,
    getProxy,
    createProxy,
    updateProxy,
    deleteProxy,
    rotateProxy,
    getProxyLogs,
    testProxy,
    exportProxies,
    listPresets,
    createPreset,
    updatePreset,
    deletePreset,
};