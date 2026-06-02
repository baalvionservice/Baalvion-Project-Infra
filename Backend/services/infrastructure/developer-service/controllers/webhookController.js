'use strict';
const { z } = require('zod');
const webhookService = require('../services/webhookService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

const epSchema = z.object({
    url: z.string().url(),
    description: z.string().max(255).optional(),
    events: z.array(z.string()).optional(),
    mode: z.enum(['live', 'test']).optional(),
    orgId: z.string().max(128).optional(),
}).strip();

exports.create = async (req, res) => {
    const b = parse(epSchema, req.body || {});
    sendSuccess(req, res, await webhookService.createEndpoint({ ...b, orgId: b.orgId ?? orgScope(req) ?? req.auth?.orgId, actorId: req.auth?.userId }), 201);
};
exports.list       = async (req, res) => sendSuccess(req, res, await webhookService.listEndpoints(orgScope(req), req.query));
exports.get        = async (req, res) => sendSuccess(req, res, (await webhookService.getEndpoint(req.params.id, orgScope(req))).toJSON());
exports.update     = async (req, res) => sendSuccess(req, res, await webhookService.updateEndpoint(req.params.id, parse(epSchema.partial().extend({ status: z.enum(['active', 'disabled']).optional() }), req.body || {}), orgScope(req)));
exports.rollSecret = async (req, res) => sendSuccess(req, res, await webhookService.rollSecret(req.params.id, orgScope(req)));
exports.remove     = async (req, res) => sendSuccess(req, res, await webhookService.deleteEndpoint(req.params.id, orgScope(req)));
exports.sendTest   = async (req, res) => sendSuccess(req, res, await webhookService.sendTest(req.params.id, orgScope(req), req.body?.eventType || 'ping'));

exports.listDeliveries = async (req, res) => sendSuccess(req, res, await webhookService.listDeliveries(orgScope(req), { ...req.query, endpointId: req.params.id || req.query.endpointId }));
exports.redeliver      = async (req, res) => sendSuccess(req, res, await webhookService.redeliver(req.params.deliveryId, orgScope(req)));

// Internal: a service emits an event → fan out to subscribers.
exports.dispatch = async (req, res) => {
    const b = parse(z.object({ orgId: z.string().optional(), eventType: z.string().min(1), payload: z.record(z.any()).optional() }), req.body || {});
    sendSuccess(req, res, await webhookService.dispatch({ orgId: b.orgId ?? null, eventType: b.eventType, payload: b.payload ?? {} }), 201);
};
