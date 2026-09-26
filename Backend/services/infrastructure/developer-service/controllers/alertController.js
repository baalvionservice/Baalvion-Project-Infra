'use strict';
const { z } = require('zod');
const alertRuleService = require('../services/alertRuleService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

const createSchema = z.object({
    label: z.string().min(1).max(160),
    conditionType: z.enum(['keyword', 'category', 'country', 'sentiment', 'entity']),
    conditionValue: z.string().min(1).max(200),
    webhookUrl: z.string().url(),
}).strip();

exports.create = async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const orgId = orgScope(req) ?? req.auth?.orgId;
    if (!orgId) throw new AppError('FORBIDDEN', 'Account has no organization to own this rule', 403);
    const out = await alertRuleService.create({
        orgId, label: b.label, conditionType: b.conditionType, conditionValue: b.conditionValue,
        webhookUrl: b.webhookUrl, actorId: req.auth?.userId,
    });
    sendSuccess(req, res, out, 201);
};

exports.list = async (req, res) => sendSuccess(req, res, { items: await alertRuleService.list(orgScope(req) ?? req.auth?.orgId) });

exports.update = async (req, res) => {
    const b = parse(
        z.object({ label: z.string().min(1).max(160).optional(), active: z.boolean().optional(), conditionValue: z.string().min(1).max(200).optional(), webhookUrl: z.string().url().optional() }).strip(),
        req.body || {}
    );
    sendSuccess(req, res, await alertRuleService.update(req.params.id, b, orgScope(req) ?? req.auth?.orgId));
};

exports.remove = async (req, res) => sendSuccess(req, res, await alertRuleService.remove(req.params.id, orgScope(req) ?? req.auth?.orgId));

// Internal hot path: news-service calls this for every newly-enriched article.
const evaluateSchema = z.object({
    title: z.string(),
    category: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    sentiment: z.string().nullable().optional(),
    entities: z.array(z.object({ name: z.string(), count: z.number().optional() })).nullable().optional(),
    published_at: z.string().optional(),
}).strip();

exports.evaluate = async (req, res) => {
    const article = parse(evaluateSchema, req.body || {});
    sendSuccess(req, res, await alertRuleService.evaluateArticle(article));
};
