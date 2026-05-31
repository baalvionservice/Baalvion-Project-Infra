'use strict';
const { z } = require('zod');
const agentService = require('../services/agentService');
const leaderboardService = require('../services/leaderboardService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

// ── plans ──
const planSchema = z.object({
    name: z.string().min(1).max(160), type: z.enum(['flat', 'percent', 'tiered']).optional(),
    rate: z.number().min(0).optional(), tiers: z.array(z.object({ minAmount: z.number(), rate: z.number() })).optional(),
    recurringPct: z.number().min(0).max(1).optional(), overridePcts: z.array(z.number().min(0).max(1)).optional(),
    currency: z.string().max(8).optional(), orgId: z.string().max(128).optional(),
}).strip();
exports.createPlan = async (req, res) => sendSuccess(req, res, await agentService.createPlan(parse(planSchema, req.body || {}), req.auth), 201);
exports.listPlans  = async (req, res) => sendSuccess(req, res, await agentService.listPlans(orgScope(req)));

// ── agents ──
const agentSchema = z.object({
    name: z.string().min(1).max(160), code: z.string().max(32).optional(), email: z.string().email().optional(),
    tier: z.string().max(32).optional(), userId: z.string().max(64).optional(), parentAgentId: z.string().uuid().optional(),
    commissionPlanId: z.string().uuid().optional(), orgId: z.string().max(128).optional(), metadata: z.record(z.any()).optional(),
}).strip();
exports.createAgent = async (req, res) => sendSuccess(req, res, await agentService.createAgent(parse(agentSchema, req.body || {}), req.auth), 201);
exports.listAgents  = async (req, res) => sendSuccess(req, res, await agentService.listAgents(orgScope(req), req.query));
exports.getAgent    = async (req, res) => sendSuccess(req, res, (await agentService.getAgent(req.params.id, orgScope(req))).toJSON());
exports.updateAgent = async (req, res) => sendSuccess(req, res, await agentService.updateAgent(req.params.id, parse(agentSchema.partial().extend({ status: z.enum(['active', 'suspended', 'inactive']).optional() }), req.body || {}), orgScope(req)));

// ── sales + commissions ──
const saleSchema = z.object({
    agentId: z.string().uuid(), amount: z.number().positive(), currency: z.string().max(8).optional(),
    kind: z.enum(['new', 'recurring']).optional(), customerRef: z.string().max(128).optional(),
    description: z.string().max(255).optional(), status: z.enum(['confirmed', 'pending', 'reversed']).optional(),
    occurredAt: z.string().datetime().optional(), metadata: z.record(z.any()).optional(),
}).strip();
exports.recordSale = async (req, res) => sendSuccess(req, res, await agentService.recordSale(parse(saleSchema, req.body || {}), req.auth), 201);
exports.listSales  = async (req, res) => sendSuccess(req, res, await agentService.listSales(orgScope(req), req.query));

exports.listCommissions   = async (req, res) => sendSuccess(req, res, await agentService.listCommissions(orgScope(req), req.query));
exports.commissionSummary = async (req, res) => sendSuccess(req, res, await agentService.commissionSummary(orgScope(req), req.query));
exports.transition = async (req, res) => {
    const b = parse(z.object({ ids: z.array(z.string().uuid()).min(1), action: z.enum(['approve', 'pay', 'reverse']), payoutRef: z.string().optional() }), req.body || {});
    sendSuccess(req, res, await agentService.transitionCommissions(b.ids, b.action, orgScope(req), { payoutRef: b.payoutRef }));
};
exports.payout = async (req, res) => {
    const b = parse(z.object({ period: z.string().optional(), payoutRef: z.string().optional() }), req.body || {});
    sendSuccess(req, res, await agentService.payoutAgent(req.params.id, orgScope(req), b));
};

// ── leaderboard ──
exports.leaderboard = async (req, res) => sendSuccess(req, res, await leaderboardService.leaderboard({ orgScope: orgScope(req), metric: req.query.metric, period: req.query.period || null, limit: req.query.limit }));
exports.agentRank   = async (req, res) => { await agentService.getAgent(req.params.id, orgScope(req)); sendSuccess(req, res, await leaderboardService.agentRank({ agentId: req.params.id, orgScope: orgScope(req), metric: req.query.metric, period: req.query.period || null })); };
