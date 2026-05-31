'use strict';
const { z } = require('zod');
const specService = require('../services/specService');
const eventRegistry = require('../services/eventRegistry');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

// ── OpenAPI specs ──
const specSchema = z.object({
    service: z.string().min(1).max(80),
    title: z.string().max(160).optional(),
    version: z.string().max(32).optional(),
    spec: z.record(z.any()),
    isPublic: z.boolean().optional(),
}).strip();

exports.upsertSpec = async (req, res) => sendSuccess(req, res, await specService.upsert({ ...parse(specSchema, req.body || {}), actorId: req.auth?.userId }), 201);
exports.listSpecs  = async (req, res) => sendSuccess(req, res, await specService.list({ publicOnly: false }));
exports.getSpec    = async (req, res) => sendSuccess(req, res, await specService.get({ service: req.params.service, version: req.query.version }, { publicOnly: false }));
exports.removeSpec = async (req, res) => sendSuccess(req, res, await specService.remove({ service: req.params.service, version: req.query.version }));

// Public (no auth) — serve the raw OpenAPI JSON for a docs site.
exports.publicListSpecs = async (req, res) => sendSuccess(req, res, await specService.list({ publicOnly: true }));
exports.publicGetSpec   = async (req, res) => res.status(200).json((await specService.get({ service: req.params.service, version: req.query.version }, { publicOnly: true })).spec);

// ── event types ──
exports.listEventTypes = async (req, res) => sendSuccess(req, res, { eventTypes: await eventRegistry.listEventTypes() });
exports.registerEventType = async (req, res) => {
    const b = parse(z.object({ name: z.string().min(1).max(120), category: z.string().max(60).optional(), description: z.string().optional(), sample: z.record(z.any()).optional() }), req.body || {});
    sendSuccess(req, res, await eventRegistry.registerEventType(b), 201);
};

// ── sandbox ── test-mode echo so developers can validate signing/keys end-to-end.
exports.sandboxEcho = async (req, res) => sendSuccess(req, res, {
    sandbox: true,
    received: { method: req.method, headers: { 'content-type': req.headers['content-type'] }, body: req.body ?? null },
    principal: req.internal ? 'service' : { userId: req.auth?.userId, orgId: req.auth?.orgId, roles: req.auth?.roles },
    note: 'Test-mode echo endpoint. Use a bk_test_ key path or a signed webhook to validate your integration.',
});
