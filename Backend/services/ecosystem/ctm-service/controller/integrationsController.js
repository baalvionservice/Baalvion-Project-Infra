'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const events = require('../service/events');
const github = require('../service/github');
const sandbox = require('../service/sandbox');
const { assertSafeUrl } = require('../utils/safeUrl');

const maskKey = (k) => (k ? `••••••••${String(k).slice(-4)}` : '');

// ── Webhooks ────────────────────────────────────────────────────────────────────
const mapWebhook = (w, includeSecret = false) => ({
    id: w.id, name: w.name, url: w.url, events: w.events || [], status: w.status,
    lastTriggered: w.last_triggered_at ? new Date(w.last_triggered_at).toISOString() : undefined,
    ...(includeSecret ? { secret: w.secret } : {}),
});

exports.listWebhooks = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.company_id) where[Op.or] = [{ company_id: req.query.company_id }, { company_id: null }];
        const rows = await db.webhooks.findAll({ where, order: [['created_at', 'DESC']] });
        sendSuccess(res, rows.map((w) => mapWebhook(w)));
    } catch (err) { next(err); }
};

exports.createWebhook = async (req, res, next) => {
    try {
        const { name, url, events: evs, company_id } = req.body;
        if (!name || !url) throw new AppError('VALIDATION_ERROR', 'name and url are required', 400);
        const w = await db.webhooks.create({
            name, url, events: Array.isArray(evs) ? evs : [], company_id: company_id ?? req.auth?.orgId ?? null,
            secret: events.newSecret(), status: 'Active',
        });
        // Return the secret ONCE so the integrator can store it for signature verification.
        sendSuccess(res, mapWebhook(w, true), 201);
    } catch (err) { next(err); }
};

exports.updateWebhook = async (req, res, next) => {
    try {
        const w = await db.webhooks.findByPk(req.params.id);
        if (!w) throw new AppError('NOT_FOUND', 'Webhook not found', 404);
        ['name', 'url', 'status'].forEach((f) => { if (req.body[f] !== undefined) w[f] = req.body[f]; });
        if (req.body.events !== undefined) w.events = req.body.events;
        await w.save();
        sendSuccess(res, mapWebhook(w));
    } catch (err) { next(err); }
};

exports.deleteWebhook = async (req, res, next) => {
    try {
        const w = await db.webhooks.findByPk(req.params.id);
        if (!w) throw new AppError('NOT_FOUND', 'Webhook not found', 404);
        await w.destroy();
        sendSuccess(res, { id: req.params.id, deleted: true });
    } catch (err) { next(err); }
};

exports.getWebhookDeliveries = async (req, res, next) => {
    try {
        const rows = await db.webhook_deliveries.findAll({
            where: { webhook_id: req.params.id }, order: [['created_at', 'DESC']], limit: 100,
        });
        sendSuccess(res, rows.map((d) => ({
            id: d.id, webhookId: d.webhook_id, event: d.event,
            timestamp: new Date(d.created_at).toISOString(),
            status: d.status,
            payload: JSON.stringify(d.request_payload),
            responseStatus: d.response_status, responseBody: d.response_body, attempt: d.attempt,
        })));
    } catch (err) { next(err); }
};

exports.testWebhook = async (req, res, next) => {
    try {
        const w = await db.webhooks.findByPk(req.params.id);
        if (!w) throw new AppError('NOT_FOUND', 'Webhook not found', 404);
        const ok = await events.deliver(w, 'ping', { id: 'test', event: 'ping', created_at: new Date().toISOString(), data: { message: 'Test delivery from Baalvion CTM' } });
        sendSuccess(res, { delivered: ok });
    } catch (err) { next(err); }
};

// ── API Integrations ─────────────────────────────────────────────────────────────
const mapIntegration = (i) => {
    // Sequelize serializes auto-timestamps as camelCase on instances (createdAt) and
    // snake_case on raw rows (created_at) — accept either.
    const ts = i.last_sync || i.created_at || i.createdAt;
    return {
        id: i.id, name: i.name, category: i.category, description: i.description, status: i.status,
        lastSync: ts ? new Date(ts).toISOString() : new Date().toISOString(),
        apiKey: maskKey(i.api_key), endpointUrl: i.endpoint_url, subscribedEvents: i.subscribed_events || [],
    };
};

exports.listApiIntegrations = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.company_id) where[Op.or] = [{ company_id: req.query.company_id }, { company_id: null }];
        const rows = await db.api_integrations.findAll({ where, order: [['created_at', 'DESC']] });
        sendSuccess(res, rows.map(mapIntegration));
    } catch (err) { next(err); }
};

exports.createApiIntegration = async (req, res, next) => {
    try {
        const b = req.body;
        if (!b.name) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
        const i = await db.api_integrations.create({
            name: b.name, category: b.category || 'Other', description: b.description,
            api_key: b.api_key ?? b.apiKey, endpoint_url: b.endpoint_url ?? b.endpointUrl,
            subscribed_events: b.subscribed_events ?? b.subscribedEvents ?? [],
            status: 'Inactive', company_id: b.company_id ?? req.auth?.orgId ?? null,
        });
        sendSuccess(res, mapIntegration(i), 201);
    } catch (err) { next(err); }
};

exports.updateApiIntegration = async (req, res, next) => {
    try {
        const i = await db.api_integrations.findByPk(req.params.id);
        if (!i) throw new AppError('NOT_FOUND', 'Integration not found', 404);
        const b = req.body;
        if (b.name !== undefined) i.name = b.name;
        if (b.category !== undefined) i.category = b.category;
        if (b.description !== undefined) i.description = b.description;
        if (b.status !== undefined) i.status = b.status;
        if ((b.api_key ?? b.apiKey) !== undefined) i.api_key = b.api_key ?? b.apiKey;
        if ((b.endpoint_url ?? b.endpointUrl) !== undefined) i.endpoint_url = b.endpoint_url ?? b.endpointUrl;
        if ((b.subscribed_events ?? b.subscribedEvents) !== undefined) i.subscribed_events = b.subscribed_events ?? b.subscribedEvents;
        await i.save();
        sendSuccess(res, mapIntegration(i));
    } catch (err) { next(err); }
};

exports.deleteApiIntegration = async (req, res, next) => {
    try {
        const i = await db.api_integrations.findByPk(req.params.id);
        if (!i) throw new AppError('NOT_FOUND', 'Integration not found', 404);
        await i.destroy();
        sendSuccess(res, { id: req.params.id, deleted: true });
    } catch (err) { next(err); }
};

exports.testApiIntegration = async (req, res, next) => {
    try {
        const i = await db.api_integrations.findByPk(req.params.id);
        if (!i) throw new AppError('NOT_FOUND', 'Integration not found', 404);
        let ok = false, detail = 'No endpoint configured';
        if (i.endpoint_url) {
            try {
                // SSRF guard: validate the stored endpoint_url before making the outbound
                // request. Rejects private/loopback/link-local addresses and non-http(s) schemes.
                // The stored api_key is intentionally NOT forwarded — sending secrets to an
                // arbitrary URL is a credential-exfiltration risk.
                await assertSafeUrl(i.endpoint_url);
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 4000);
                // Ping without Authorization to avoid credential forwarding to unknown hosts.
                const r = await fetch(i.endpoint_url, { signal: controller.signal });
                clearTimeout(timer);
                ok = r.status < 500; detail = `HTTP ${r.status}`;
            } catch (e) { detail = String(e.message); }
        }
        i.status = ok ? 'Active' : 'Error';
        i.last_sync = new Date();
        await i.save();
        await db.integration_logs.create({ source: i.name, event_type: 'connection.test', status: ok ? 'Success' : 'Error', description: detail, related_entity: { type: 'System', id: i.id } });
        sendSuccess(res, { ok, detail, integration: mapIntegration(i) });
    } catch (err) { next(err); }
};

// ── Integration logs ─────────────────────────────────────────────────────────────
exports.listIntegrationLogs = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.source) where.source = req.query.source;
        const rows = await db.integration_logs.findAll({ where, order: [['created_at', 'DESC']], limit: Number(req.query.limit || 100) });
        sendSuccess(res, rows.map((l) => ({
            id: l.id, source: l.source, eventType: l.event_type, status: l.status,
            timestamp: new Date(l.created_at).toISOString(), description: l.description,
            relatedEntity: l.related_entity && l.related_entity.type ? l.related_entity : { type: 'System', id: '' },
        })));
    } catch (err) { next(err); }
};

// ── GitHub (real public-repo metadata) ──────────────────────────────────────────
exports.listGitHubRepositories = async (req, res, next) => {
    try {
        // Source the distinct GitHub URLs candidates actually submitted.
        const subs = await db.submissions.findAll({
            where: { code_url: { [Op.iLike]: '%github.com%' } },
            attributes: ['code_url', 'user_id'], order: [['updated_at', 'DESC']], limit: 12, raw: true,
        });
        const seen = new Set();
        const out = [];
        for (const s of subs) {
            if (seen.has(s.code_url)) continue;
            seen.add(s.code_url);
            try {
                const meta = await github.fetchRepoMeta(s.code_url, undefined, String(s.user_id));
                out.push({ ...meta, commitCount: meta.commitCount ?? 0 });
            } catch (e) {
                const p = github.parseRepo(s.code_url);
                out.push({ id: s.code_url, name: p ? `${p.owner}/${p.repo}` : s.code_url, url: s.code_url, ownerName: '', ownerId: String(s.user_id), status: 'Error', lastSync: new Date().toISOString(), commitCount: 0, branchCount: 0, lastCommitMessage: String(e.message) });
            }
        }
        await db.integration_logs.create({ source: 'GitHub', event_type: 'repos.sync', status: 'Success', description: `Synced ${out.length} repo(s)`, related_entity: { type: 'System', id: '' } }).catch(() => {});
        sendSuccess(res, out);
    } catch (err) { next(err); }
};

exports.getGitHubRepo = async (req, res, next) => {
    try {
        const url = req.query.url;
        if (!url) throw new AppError('VALIDATION_ERROR', 'url is required', 400);
        const meta = await github.fetchRepoMeta(url, req.query.ownerName, req.query.ownerId);
        sendSuccess(res, { ...meta, commitCount: meta.commitCount ?? 0 });
    } catch (err) { next(err); }
};

// ── Test cases / auto-validation ─────────────────────────────────────────────────
const mapTestCase = (t) => ({
    id: t.id, submissionId: t.submission_id, name: t.name, description: t.description || '',
    expectedOutcome: t.expected_outcome || '', actualOutcome: t.actual_outcome || '', status: t.status,
    runtimeMs: t.runtime_ms ?? undefined,
});

exports.listTestCases = async (req, res, next) => {
    try {
        const rows = await db.test_cases.findAll({ where: { submission_id: req.params.id }, order: [['created_at', 'ASC']] });
        sendSuccess(res, rows.map(mapTestCase));
    } catch (err) { next(err); }
};

exports.createTestCase = async (req, res, next) => {
    try {
        const b = req.body;
        if (!b.name) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
        const t = await db.test_cases.create({
            submission_id: req.params.id, name: b.name, description: b.description,
            expected_outcome: b.expected_outcome ?? b.expectedOutcome,
            actual_outcome: b.actual_outcome ?? b.actualOutcome,
            status: b.status || 'Pending',
        });
        sendSuccess(res, mapTestCase(t), 201);
    } catch (err) { next(err); }
};

// Run the sandbox (Judge0) against a submission's code. Falls back to recording pending
// cases when no sandbox is configured. Updates submission auto-score on completion.
exports.runTestCases = async (req, res, next) => {
    try {
        const submission = await db.submissions.findByPk(req.params.id, { include: [{ association: 'task' }] });
        if (!submission) throw new AppError('NOT_FOUND', 'Submission not found', 404);
        const cases = Array.isArray(req.body.cases) ? req.body.cases : (submission.task?.metadata?.testCases || []);
        const language = req.body.language || submission.task?.metadata?.language || 'javascript';
        const sourceCode = req.body.sourceCode || submission.metadata?.sourceCode || '';

        let results = null;
        if (sandbox.isConfigured() && sourceCode && cases.length) {
            results = await sandbox.runTestCases({ sourceCode, language, cases });
        }

        if (!results) {
            // No sandbox/code — persist the declared cases as Pending (honest).
            results = cases.map((c) => ({ name: c.name || 'case', description: c.description || '', expected_outcome: c.expected_output || '', actual_outcome: '', status: 'Pending', runtime_ms: null, metadata: {} }));
        }

        await db.test_cases.destroy({ where: { submission_id: submission.id } });
        const created = await db.test_cases.bulkCreate(results.map((r) => ({ ...r, submission_id: submission.id })));

        // Auto-score = % passed (only when really executed).
        const ran = results.filter((r) => r.status !== 'Pending');
        if (ran.length) {
            const passed = ran.filter((r) => r.status === 'Passed').length;
            const autoScore = Math.round((passed / ran.length) * 100);
            submission.metadata = { ...(submission.metadata || {}), autoScore, autoScoringStatus: 'Completed', validationStatus: passed === ran.length ? 'Valid' : 'Warning' };
            await submission.save();
        }
        sendSuccess(res, { ran: ran.length, total: results.length, sandbox: sandbox.isConfigured(), testCases: created.map(mapTestCase) }, 201);
    } catch (err) { next(err); }
};
