'use strict';
const db = require('../models');
const { Errors } = require('../utils/errors');
const { evaluate, ConditionError } = require('../engine/conditionEvaluator');

const keyify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120);

function serialize(p) {
    if (!p) return null;
    return {
        id: p.id, tenantId: p.tenant_id, key: p.key, name: p.name, description: p.description,
        effect: p.effect, priority: p.priority, target: p.target || {}, condition: p.condition || {},
        obligations: p.obligations || {}, status: p.status, version: p.version,
        createdBy: p.created_by, createdAt: p.created_at, updatedAt: p.updated_at,
    };
}

/** Reject a condition AST that the evaluator can't parse, before it's stored. */
function validateCondition(condition) {
    if (!condition || Object.keys(condition).length === 0) return;
    try { evaluate(condition, { subject: {}, resource: {}, env: {}, tenant: {} }); }
    catch (e) {
        if (e instanceof ConditionError) throw Errors.badRequest(`Invalid condition: ${e.message}`);
        // Evaluation may fail on missing attributes — that's fine, the AST is structurally valid.
    }
}

async function getPolicy(id) {
    const p = await db.Policy.findByPk(id);
    if (!p) throw Errors.notFound('Policy not found');
    return p;
}

async function listPolicies({ tenantId, status, effect } = {}) {
    const where = {};
    if (tenantId !== undefined) where.tenant_id = tenantId || null;
    if (status) where.status = status;
    if (effect) where.effect = effect;
    const rows = await db.Policy.findAll({ where, order: [['priority', 'DESC'], ['name', 'ASC']] });
    return rows.map(serialize);
}

async function createPolicy(input, actorId) {
    if (!input.name) throw Errors.badRequest('name is required');
    if (input.effect && !['allow', 'deny'].includes(input.effect)) throw Errors.badRequest("effect must be 'allow' or 'deny'");
    validateCondition(input.condition);
    const key = input.key ? keyify(input.key) : keyify(input.name);
    if (input.tenantId) await db.Tenant.findByPk(input.tenantId).then((t) => { if (!t) throw Errors.badRequest('tenantId does not exist'); });
    try {
        const p = await db.Policy.create({
            tenant_id: input.tenantId || null, key, name: input.name, description: input.description || null,
            effect: input.effect || 'allow', priority: Number.isInteger(input.priority) ? input.priority : 100,
            target: input.target || {}, condition: input.condition || {}, obligations: input.obligations || {},
            status: input.status || 'active', created_by: actorId || null,
        });
        return serialize(p);
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') throw Errors.conflict(`Policy '${key}' already exists for this tenant`);
        throw e;
    }
}

async function updatePolicy(id, patch, actorId) {
    const p = await getPolicy(id);
    if (patch.condition !== undefined) validateCondition(patch.condition);
    if (patch.effect && !['allow', 'deny'].includes(patch.effect)) throw Errors.badRequest("effect must be 'allow' or 'deny'");
    const map = { name: 'name', description: 'description', effect: 'effect', priority: 'priority', target: 'target', condition: 'condition', obligations: 'obligations', status: 'status' };
    for (const [k, col] of Object.entries(map)) if (patch[k] !== undefined) p[col] = patch[k];
    p.version = (p.version || 1) + 1;
    p.created_by = p.created_by || actorId || null;
    await p.save();
    return serialize(p);
}

async function deletePolicy(id) {
    const p = await getPolicy(id);
    await p.destroy();
    return { id, deleted: true };
}

// ─── Subject attributes (ABAC inputs about a user) ─────────────────────────────

async function setSubjectAttribute(userId, { tenantId, key, value }) {
    if (!userId || !key) throw Errors.badRequest('userId and key are required');
    const [row, created] = await db.SubjectAttribute.findOrCreate({
        where: { user_id: String(userId), tenant_id: tenantId || null, key },
        defaults: { value: value ?? null },
    });
    if (!created) { row.value = value ?? null; await row.save(); }
    return { userId: String(userId), tenantId: tenantId || null, key, value: row.value, created };
}

async function getSubjectAttributes(userId, tenantId) {
    const where = { user_id: String(userId) };
    if (tenantId !== undefined) where.tenant_id = tenantId || null;
    const rows = await db.SubjectAttribute.findAll({ where });
    return rows.map((r) => ({ key: r.key, value: r.value, tenantId: r.tenant_id }));
}

module.exports = { serialize, getPolicy, listPolicies, createPolicy, updatePolicy, deletePolicy, setSubjectAttribute, getSubjectAttributes, validateCondition };
