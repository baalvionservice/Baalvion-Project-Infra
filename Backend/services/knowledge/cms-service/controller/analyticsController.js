'use strict';
/**
 * Unified analytics reporting endpoints (website-scoped). Every handler runs
 * after loadCmsRole, so req.params.websiteId is the canonical UUID and the caller
 * is a verified member (or platform admin). Reads come from the rollup tables via
 * reportingService; provider management enqueues sync jobs.
 */
const reportingService = require('../service/analytics/reportingService');
const credentialService = require('../service/analytics/credentialService');
const websiteRegistry = require('../service/analytics/websiteRegistry');
const { PROVIDER_CATALOG, get: getConnector } = require('../connectors/registry');
const { enqueueSync, health: queueHealth } = require('../queues/analyticsQueue');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const dayStr = (d) => d.toISOString().slice(0, 10);

function defaultRange(q = {}) {
    const to = q.to || dayStr(new Date());
    const from = q.from || dayStr(new Date(Date.now() - 29 * 86_400_000));
    return { from, to };
}

async function overview(req, res, next) {
    try {
        const { from, to } = defaultRange(req.validatedQuery);
        const module = req.validatedQuery?.module || 'traffic';
        const data = await reportingService.overview(req.params.websiteId, { from, to, module });
        return sendSuccess(req, res, { range: { from, to }, module, metrics: data });
    } catch (err) { return next(err); }
}

async function timeseries(req, res, next) {
    try {
        const { from, to } = defaultRange(req.validatedQuery);
        const module = req.validatedQuery?.module || 'traffic';
        const metric = req.validatedQuery?.metric || 'pageviews';
        const series = await reportingService.timeseries(req.params.websiteId, { metric, from, to, module });
        return sendSuccess(req, res, { range: { from, to }, module, metric, series });
    } catch (err) { return next(err); }
}

async function breakdown(req, res, next) {
    try {
        const dimension = req.validatedQuery?.dimension;
        if (!dimension) throw new AppError('BAD_REQUEST', 'dimension query param is required', 400);
        const { from, to } = defaultRange(req.validatedQuery);
        const module = req.validatedQuery?.module || 'traffic';
        const metric = req.validatedQuery?.metric || 'pageviews';
        const limit = req.validatedQuery?.limit || 20;
        const rows = await reportingService.breakdown(req.params.websiteId, { dimension, metric, from, to, module, limit });
        return sendSuccess(req, res, { range: { from, to }, module, dimension, metric, rows });
    } catch (err) { return next(err); }
}

async function realtime(req, res, next) {
    try {
        const windowMin = req.validatedQuery?.windowMin || 5;
        const data = await reportingService.realtime(req.params.websiteId, { windowMin });
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
}

async function moduleTotals(req, res, next) {
    try {
        const module = req.validatedQuery?.module || 'traffic';
        const { from, to } = defaultRange(req.validatedQuery);
        const totals = await reportingService.moduleTotals(req.params.websiteId, { module, from, to });
        return sendSuccess(req, res, { range: { from, to }, module, totals });
    } catch (err) { return next(err); }
}

async function infra(req, res, next) {
    try {
        const data = await reportingService.infra();
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
}

async function seoVitals(req, res, next) {
    try {
        const { from, to } = defaultRange(req.validatedQuery);
        const vitals = await reportingService.seoVitals(req.params.websiteId, { from, to });
        return sendSuccess(req, res, { range: { from, to }, vitals });
    } catch (err) { return next(err); }
}

async function providerTotals(req, res, next) {
    try {
        const totals = await reportingService.providerTotals(req.params.websiteId, { provider: req.params.provider });
        return sendSuccess(req, res, { provider: req.params.provider, totals });
    } catch (err) { return next(err); }
}

async function providerBreakdown(req, res, next) {
    try {
        const dimension = req.validatedQuery?.dimension;
        if (!dimension) throw new AppError('BAD_REQUEST', 'dimension query param is required', 400);
        const metric = req.validatedQuery?.metric || 'clicks';
        const limit = req.validatedQuery?.limit || 25;
        const rows = await reportingService.providerBreakdown(req.params.websiteId, {
            provider: req.params.provider, metric, dimension, limit,
        });
        return sendSuccess(req, res, { provider: req.params.provider, metric, dimension, rows });
    } catch (err) { return next(err); }
}

async function providers(req, res, next) {
    try {
        const site = await websiteRegistry.resolve(req.params.websiteId);
        if (!site) throw new AppError('NOT_FOUND', 'Website not found', 404);
        const connected = await credentialService.listAnalyticsProviders(site.slug);
        const catalog = PROVIDER_CATALOG.map((p) => ({ ...p, implemented: !!getConnector(p.provider) }));
        return sendSuccess(req, res, { connected, catalog });
    } catch (err) { return next(err); }
}

async function triggerSync(req, res, next) {
    try {
        const provider = req.params.provider;
        if (!getConnector(provider)) {
            throw new AppError('NOT_IMPLEMENTED', `Connector "${provider}" is not available yet`, 501);
        }
        await enqueueSync({ websiteId: req.params.websiteId, provider, window: 'incremental' });
        return sendSuccess(req, res, { enqueued: true, provider }, 202);
    } catch (err) { return next(err); }
}

async function health(req, res, next) {
    try {
        const queues = await queueHealth();
        return sendSuccess(req, res, { queues });
    } catch (err) { return next(err); }
}

async function anomalies(req, res, next) {
    try {
        const rows = await reportingService.anomalies(req.params.websiteId, { limit: req.validatedQuery?.limit || 50 });
        return sendSuccess(req, res, { anomalies: rows });
    } catch (err) { return next(err); }
}

async function providerState(req, res, next) {
    try {
        const state = await reportingService.providerState(req.params.websiteId);
        return sendSuccess(req, res, { providers: state });
    } catch (err) { return next(err); }
}

/** Server-Sent Events realtime stream, sharded by website (Redis pub/sub fanout). */
function realtimeStream(req, res) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    if (res.flushHeaders) res.flushHeaders();
    res.write(`event: ready\ndata: {"ok":true}\n\n`);

    const realtimeService = require('../service/analytics/realtimeService');
    const unsubscribe = realtimeService.subscribe(req.params.websiteId, (msg) => {
        try { res.write(`data: ${JSON.stringify(msg)}\n\n`); } catch { /* client gone */ }
    });
    // Heartbeat so proxies keep the connection open.
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* noop */ } }, 25000);
    req.on('close', () => { clearInterval(ping); unsubscribe(); });
}

module.exports = {
    overview, timeseries, breakdown, realtime, providers, triggerSync, health,
    seoVitals, providerTotals, providerBreakdown, moduleTotals, infra,
    anomalies, providerState, realtimeStream,
};
