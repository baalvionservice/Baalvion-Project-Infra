'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { ROLE_KEY, LEVEL } = require('../config/systemRoles');
const assignmentService = require('./assignmentService');
const { matches } = require('../engine/conditionEvaluator');
const { buildContext } = require('../engine/attributeResolver');
const logger = require('../utils/logger');

/** Candidate permission keys for an (resource, action) pair, incl. wildcards. */
function candidateKeys(resourceType, action) {
    const r = resourceType || '*';
    const a = action || '*';
    return [`${r}:${a}`, `${r}:*`, `*:${a}`, '*:*'];
}

/** Load + flatten a user's stored subject attributes (request attrs override later). */
async function loadSubjectAttrs(userId, tenantId) {
    const where = { user_id: String(userId) };
    if (tenantId) where[Op.or] = [{ tenant_id: tenantId }, { tenant_id: null }];
    const rows = await db.SubjectAttribute.findAll({ where });
    const flat = {};
    // Global (tenant_id null) first, tenant-specific overrides on top.
    for (const r of rows.filter((x) => !x.tenant_id)) flat[r.key] = r.value;
    for (const r of rows.filter((x) => x.tenant_id)) flat[r.key] = r.value;
    return flat;
}

/** Does a policy's target match this request? Empty/missing target ⇒ applies to all. */
function targetMatches(target = {}, { action, resourceType, roles, scopeType, scopeId }) {
    const inList = (list, val) => !Array.isArray(list) || list.length === 0 || list.includes('*') || list.includes(val);
    if (!inList(target.actions, action)) return false;
    if (!inList(target.resources, resourceType)) return false;
    if (!inList(target.scopeTypes, scopeType)) return false;
    if (!inList(target.scopes, scopeId)) return false;
    if (Array.isArray(target.roles) && target.roles.length > 0) {
        if (!roles.some((r) => target.roles.includes(r))) return false;
    }
    return true;
}

/**
 * The Policy Decision Point.
 *
 * Combination strategy = DENY-OVERRIDES:
 *   1. an explicit deny (RBAC permission effect=deny, or a matching deny policy) wins;
 *   2. else allow if RBAC grants it, super_admin baseline, or a matching allow policy;
 *   3. else default-deny.
 * Obligations from every matched policy are merged and returned to the PEP.
 *
 * @returns {{decision:'allow'|'deny', allow:boolean, obligations:object, reasons:string[], matched:object}}
 */
async function authorize(request = {}, { log = true, requestId } = {}) {
    const userId = request.subject?.id || request.userId || request.subjectId;
    const action = request.action || null;
    const resource = request.resource || {};
    const resourceType = resource.type || request.resourceType || null;
    const scopeId = request.scopeId || resource.orgId || null;
    const tenantId = request.tenantId || null;

    const reasons = [];
    if (!userId) return finalize({ decision: 'deny', reasons: ['no subject'], userId, action, resourceType, scopeId, tenantId, log, requestId });

    // ── RBAC half ──────────────────────────────────────────────────────────────
    const effective = await assignmentService.getUserEffective(userId, { scopeId: scopeId || undefined });
    const isSuper = effective.roles.includes(ROLE_KEY.SUPER_ADMIN) || effective.maxLevel >= LEVEL.SUPER_ADMIN
        || (Array.isArray(request.subject?.roles) && request.subject.roles.includes(ROLE_KEY.SUPER_ADMIN));

    // ── Attribute context ────────────────────────────────────────────────────────
    const storedAttrs = await loadSubjectAttrs(userId, tenantId);
    let tenant = {};
    if (tenantId) {
        const t = await db.Tenant.findByPk(tenantId);
        if (t) tenant = { id: t.id, type: t.type, attributes: t.attributes || {} };
    }
    const ctx = buildContext({
        subject: {
            id: userId, roles: effective.roles, level: effective.maxLevel,
            orgId: request.subject?.orgId ?? scopeId, scopes: Object.keys(effective.perScope),
            attributes: request.subject?.attributes || {},
        },
        storedAttrs, resource, action, context: request.context || {}, tenant,
    });

    // ── RBAC permission match ────────────────────────────────────────────────────
    const permIndex = new Map(effective.permissions.map((p) => [p.key, p]));
    let rbacAllow = false, rbacDeny = false, matchedPermission = null;
    for (const key of candidateKeys(resourceType, action)) {
        const grant = permIndex.get(key);
        if (!grant) continue;
        const ok = matches(grant.constraints || {}, ctx);
        if (!ok) continue;
        matchedPermission = key;
        if (grant.effect === 'deny') { rbacDeny = true; reasons.push(`rbac deny via ${grant.viaRole} (${key})`); }
        else { rbacAllow = true; reasons.push(`rbac allow via ${grant.viaRole} (${key})`); }
    }
    if (isSuper && !rbacAllow) { rbacAllow = true; reasons.push('super_admin baseline allow'); }

    // ── ABAC policy evaluation ────────────────────────────────────────────────────
    const policies = await db.Policy.findAll({
        where: { status: 'active', [Op.or]: [{ tenant_id: tenantId || null }, { tenant_id: null }] },
        order: [['priority', 'DESC']],
    });
    const matchedPolicies = [];
    let policyDeny = false, policyAllow = false;
    let obligations = {};
    for (const p of policies) {
        if (!targetMatches(p.target || {}, { action, resourceType, roles: effective.roles, scopeType: tenant.type, scopeId })) continue;
        if (!matches(p.condition || {}, ctx)) continue;
        matchedPolicies.push({ key: p.key, effect: p.effect, priority: p.priority });
        obligations = { ...obligations, ...(p.obligations || {}) };
        if (p.effect === 'deny') { policyDeny = true; reasons.push(`policy deny: ${p.key}`); }
        else { policyAllow = true; reasons.push(`policy allow: ${p.key}`); }
    }

    // ── Combine (deny-overrides) ───────────────────────────────────────────────────
    let decision;
    if (rbacDeny || policyDeny) decision = 'deny';
    else if (rbacAllow || policyAllow) decision = 'allow';
    else { decision = 'deny'; reasons.push('default deny (no matching grant or policy)'); }

    return finalize({
        decision, reasons, obligations,
        matched: { permission: matchedPermission, policies: matchedPolicies, roles: effective.roles, level: effective.maxLevel },
        userId, action, resourceType, scopeId, tenantId, request, log, requestId,
    });
}

async function finalize(o) {
    const result = {
        decision: o.decision,
        allow: o.decision === 'allow',
        obligations: o.obligations || {},
        reasons: o.reasons || [],
        matched: o.matched || {},
    };
    if (o.log) {
        try {
            await db.DecisionLog.create({
                user_id: o.userId ? String(o.userId) : null,
                tenant_id: o.tenantId || null,
                action: o.action || null,
                resource: o.resourceType || null,
                scope_id: o.scopeId || null,
                decision: o.decision,
                reason: (o.reasons || []).join('; ').slice(0, 2000),
                matched_policy: o.matched?.policies?.[0]?.key || null,
                matched_role: o.matched?.roles?.[0] || null,
                obligations: result.obligations,
                request: o.request ? { action: o.action, resource: o.resourceType, scopeId: o.scopeId } : {},
                request_id: o.requestId || null,
            });
        } catch (e) { logger.warn({ err: e.message }, 'decision log write failed'); }
    }
    return result;
}

module.exports = { authorize, candidateKeys, targetMatches };
