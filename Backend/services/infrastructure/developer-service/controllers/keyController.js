'use strict';
const { z } = require('zod');
const apiKeyService = require('../services/apiKeyService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

const issueSchema = z.object({
    name: z.string().min(1).max(160),
    mode: z.enum(['live', 'test']).optional(),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
    rateLimitPerMin: z.number().int().positive().optional(),
    orgId: z.string().max(128).optional(),
}).strip();

exports.issue = async (req, res) => {
    const b = parse(issueSchema, req.body || {});
    const out = await apiKeyService.issue({ ...b, orgId: b.orgId ?? orgScope(req) ?? req.auth?.orgId, actorId: req.auth?.userId });
    sendSuccess(req, res, out, 201);
};
exports.list   = async (req, res) => sendSuccess(req, res, await apiKeyService.list(orgScope(req), req.query));
exports.get    = async (req, res) => sendSuccess(req, res, apiKeyService.publicView(await apiKeyService.get(req.params.id, orgScope(req))));
exports.rotate = async (req, res) => sendSuccess(req, res, await apiKeyService.rotate(req.params.id, orgScope(req), req.auth?.userId));
exports.revoke = async (req, res) => sendSuccess(req, res, await apiKeyService.revoke(req.params.id, orgScope(req)));
exports.updateScopes = async (req, res) => {
    const b = parse(z.object({ scopes: z.array(z.string()) }), req.body || {});
    sendSuccess(req, res, await apiKeyService.updateScopes(req.params.id, b.scopes, orgScope(req)));
};

// Internal hot-path verify (gateway → developer-service).
exports.verify = async (req, res) => {
    const key = req.body?.key || req.headers['x-api-key'];
    sendSuccess(req, res, await apiKeyService.verify(key, { ip: req.ip }));
};
