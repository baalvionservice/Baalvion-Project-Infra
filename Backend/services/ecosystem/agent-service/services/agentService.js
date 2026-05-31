'use strict';

/**
 * Agent + commission-plan management and the commission tracker. recordSale()
 * attributes a sale to an agent and accrues commissions — the direct earner plus
 * decreasing overrides up the agent hierarchy — using the pure commissionEngine.
 * Commissions move accrued → approved → paid; payouts batch a period.
 */

const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const config = require('../config/appConfig');
const engine = require('./commissionEngine');
const events = require('./events');
const { Errors } = require('../utils/errors');

const crypto = require('node:crypto');
function period(d = new Date()) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
function genCode(name) { return `${(name || 'AG').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'AGNT'}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; }

// ── plans ──
async function createPlan(data, actor) {
    return (await db.CommissionPlan.create({
        org_id: data.orgId ?? actor?.orgId ?? null, name: data.name, type: data.type || 'percent',
        rate: data.rate ?? 0, tiers: data.tiers ?? [], recurring_pct: data.recurringPct ?? 0,
        override_pcts: data.overridePcts ?? [], currency: data.currency || config.agent.defaultCurrency,
    })).toJSON();
}
async function listPlans(orgScope) {
    const where = {}; if (orgScope) where.org_id = orgScope;
    return (await db.CommissionPlan.findAll({ where, order: [['created_at', 'DESC']] })).map((r) => r.toJSON());
}

// ── agents ──
async function createAgent(data, actor) {
    const code = data.code || genCode(data.name);
    if (await db.Agent.findOne({ where: { code } })) throw Errors.conflict(`Agent code '${code}' already exists`);
    return (await db.Agent.create({
        org_id: data.orgId ?? actor?.orgId ?? null, user_id: data.userId ?? null, code, name: data.name, email: data.email ?? null,
        tier: data.tier || 'agent', parent_agent_id: data.parentAgentId ?? null, commission_plan_id: data.commissionPlanId ?? null,
        metadata: data.metadata ?? {}, created_by: actor?.userId ?? null,
    })).toJSON();
}

async function listAgents(orgScope, { status, tier, parentAgentId, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (parentAgentId) where.parent_agent_id = parentAgentId;
    const { rows, count } = await db.Agent.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0 });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

async function getAgent(id, orgScope) {
    const a = await db.Agent.findByPk(id);
    if (!a) throw Errors.notFound('Agent not found');
    if (orgScope && a.org_id && a.org_id !== orgScope) throw Errors.forbidden('Agent belongs to another organization');
    return a;
}

async function updateAgent(id, data, orgScope) {
    const a = await getAgent(id, orgScope);
    const patch = {};
    for (const [k, c] of [['name', 'name'], ['email', 'email'], ['tier', 'tier'], ['status', 'status'], ['parentAgentId', 'parent_agent_id'], ['commissionPlanId', 'commission_plan_id'], ['metadata', 'metadata']]) {
        if (data[k] !== undefined) patch[c] = data[k];
    }
    patch.updated_at = new Date();
    await a.update(patch);
    return a.toJSON();
}

/** Walk parent_agent_id up to maxLevels active ancestors. */
async function resolveAncestors(agentId, maxLevels = config.agent.maxOverrideLevels) {
    const ancestors = [];
    const seen = new Set([agentId]);
    let cur = await db.Agent.findByPk(agentId);
    while (cur && cur.parent_agent_id && ancestors.length < maxLevels && !seen.has(cur.parent_agent_id)) {
        const parent = await db.Agent.findByPk(cur.parent_agent_id);
        if (!parent || parent.status !== 'active') break;
        seen.add(parent.id);
        ancestors.push(parent.id);
        cur = parent;
    }
    return ancestors;
}

// ── sales + commission accrual ──
async function recordSale(data, actor) {
    const agent = await getAgent(data.agentId, null);
    if (agent.status !== 'active') throw Errors.badRequest('Agent is not active');
    const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
    const per = period(occurredAt);
    const currency = data.currency || config.agent.defaultCurrency;

    return db.sequelize.transaction(async (tx) => {
        const sale = await db.AgentSale.create({
            agent_id: agent.id, org_id: agent.org_id, customer_ref: data.customerRef ?? null, description: data.description ?? null,
            amount: data.amount, currency, kind: data.kind || 'new', status: data.status || 'confirmed', period: per, occurred_at: occurredAt, metadata: data.metadata ?? {},
        }, { transaction: tx });

        const plan = agent.commission_plan_id ? await db.CommissionPlan.findByPk(agent.commission_plan_id, { transaction: tx }) : null;
        let commissions = [];
        if (plan && (sale.status === 'confirmed')) {
            const ancestors = await resolveAncestors(agent.id);
            const breakdown = engine.commissionBreakdown({ plan: plan.toJSON(), sale: { amount: Number(data.amount), kind: sale.kind }, sellingAgentId: agent.id, ancestors, maxLevels: config.agent.maxOverrideLevels });
            for (const line of breakdown.lines) {
                if (line.amount <= 0) continue;
                const c = await db.Commission.create({
                    agent_id: line.agentId, org_id: agent.org_id, sale_id: sale.id, plan_id: plan.id,
                    basis: line.basis, level: line.level, amount: line.amount, currency, period: per, status: 'accrued',
                    metadata: line.pct ? { pct: line.pct } : {},
                }, { transaction: tx });
                commissions.push(c.toJSON());
            }
        }
        events.publish('commission.accrued', { saleId: sale.id, agentId: agent.id, orgId: agent.org_id, amount: Number(data.amount), commissions: commissions.length, period: per }).catch(() => {});
        return { sale: sale.toJSON(), commissions };
    });
}

async function listSales(orgScope, { agentId, period: p, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (agentId) where.agent_id = agentId;
    if (p) where.period = p;
    const { rows, count } = await db.AgentSale.findAndCountAll({ where, order: [['occurred_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0 });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

// ── commissions ──
async function listCommissions(orgScope, { agentId, status, period: p, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (agentId) where.agent_id = agentId;
    if (status) where.status = status;
    if (p) where.period = p;
    const { rows, count } = await db.Commission.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 100, 500), offset: Number(offset) || 0 });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

/** Per-agent totals by commission status (the tracker summary). */
async function commissionSummary(orgScope, { agentId, period: p } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (agentId) where.agent_id = agentId;
    if (p) where.period = p;
    const rows = await db.Commission.findAll({
        where, attributes: ['status', [fn('COUNT', col('id')), 'count'], [fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        group: ['status'], raw: true,
    });
    const summary = { accrued: 0, approved: 0, paid: 0, reversed: 0, counts: {} };
    for (const r of rows) { summary[r.status] = Number(r.total); summary.counts[r.status] = Number(r.count); }
    summary.outstanding = summary.accrued + summary.approved;
    return summary;
}

async function transitionCommissions(ids, action, orgScope, { payoutRef } = {}) {
    const map = { approve: { from: ['accrued'], set: { status: 'approved', approved_at: new Date() } },
                  pay:     { from: ['approved'], set: { status: 'paid', paid_at: new Date(), payout_ref: payoutRef ?? null } },
                  reverse: { from: ['accrued', 'approved'], set: { status: 'reversed' } } };
    const t = map[action];
    if (!t) throw Errors.badRequest('Invalid action');
    const where = { id: { [Op.in]: ids }, status: { [Op.in]: t.from } };
    if (orgScope) where.org_id = orgScope;
    const [n] = await db.Commission.update(t.set, { where });
    return { action, updated: n };
}

/** Batch payout: approve+pay all outstanding commissions for an agent (optional period). */
async function payoutAgent(agentId, orgScope, { period: p, payoutRef } = {}) {
    const agent = await getAgent(agentId, orgScope);
    const where = { agent_id: agent.id, status: { [Op.in]: ['accrued', 'approved'] } };
    if (p) where.period = p;
    const rows = await db.Commission.findAll({ where });
    if (!rows.length) return { agentId, paid: 0, count: 0 };
    const ref = payoutRef || `payout_${crypto.randomBytes(6).toString('hex')}`;
    const total = rows.reduce((s, r) => s + Number(r.amount), 0);
    await db.Commission.update({ status: 'paid', approved_at: literal('COALESCE(approved_at, now())'), paid_at: new Date(), payout_ref: ref }, { where: { id: { [Op.in]: rows.map((r) => r.id) } } });
    await events.publish('agent.payout', { agentId: agent.id, orgId: agent.org_id, amount: engine.round2(total), count: rows.length, payoutRef: ref, period: p ?? null });
    return { agentId, paid: engine.round2(total), count: rows.length, payoutRef: ref };
}

module.exports = {
    period, createPlan, listPlans, createAgent, listAgents, getAgent, updateAgent, resolveAncestors,
    recordSale, listSales, listCommissions, commissionSummary, transitionCommissions, payoutAgent,
};
