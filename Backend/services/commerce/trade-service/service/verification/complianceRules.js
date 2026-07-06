'use strict';
// Compliance Engine business logic (Phase 2, Step 10). Interprets each active
// tradeops.compliance_rules row's small `condition` DSL against an org's current
// verification state, persists an append-only evaluation per run, and recomputes
// the 'compliance' checklist category from the latest evaluation per rule.
const db = require('../../models');
const checklist = require('./checklist');

// 'no_expired_items' is handled directly in evaluateRule (it needs no params).
const EVALUATORS = {
    async required_categories_approved(orgId, params) {
        const items = await db.VerificationChecklistItem.findAll({ where: { org_id: orgId, category: params.categories } });
        const missing = params.categories.filter((cat) => {
            const item = items.find((i) => i.category === cat);
            return !item || item.status !== 'approved';
        });
        return { passed: missing.length === 0, details: { missing } };
    },

    async country_not_restricted(orgId, params) {
        const org = await db.Organization.findByPk(orgId);
        const blocked = (params.blockedCountries || []).includes(org && org.country);
        return { passed: !blocked, details: { country: org && org.country } };
    },

    async sanctions_clear(orgId, params, org) {
        const subjectRef = org ? (org.code || String(org.id)) : String(orgId);
        const latest = await db.ComplianceScreening.findOne({ where: { subject_ref: subjectRef }, order: [['created_at', 'DESC']] });
        if (!latest) return { passed: true, details: { reason: 'no screening on file yet' } };
        return { passed: latest.decision !== 'block', details: { decision: latest.decision, screeningId: latest.id } };
    },
};

async function evaluateRule(rule, orgId, org) {
    const params = (rule.condition && rule.condition.params) || {};
    if (rule.condition.type === 'no_expired_items') {
        const expired = await db.VerificationChecklistItem.findAll({ where: { org_id: orgId, status: 'expired' } });
        return { passed: expired.length === 0, details: { expiredCategories: expired.map((i) => i.category) } };
    }
    const evaluator = EVALUATORS[rule.condition.type];
    if (!evaluator) return { passed: true, details: { reason: `unknown rule type "${rule.condition.type}"` } };
    return evaluator(orgId, params, org);
}

/** rule outcome → synthetic checklist-item status, reusing the same rollup rules as every other category. */
function outcomeStatus(rule, passed) {
    if (passed) return 'approved';
    if (rule.severity === 'blocking') return 'rejected';
    if (rule.severity === 'warning') return 'under_review';
    return 'submitted';
}

async function evaluateAll(orgId, tenantId) {
    const org = await db.Organization.findByPk(orgId);
    const rules = await db.ComplianceRule.findAll({ where: { is_active: true } });
    const evaluations = [];
    for (const rule of rules) {
        const { passed, details } = await evaluateRule(rule, orgId, org);
        const evaluation = await db.ComplianceRuleEvaluation.create({ tenant_id: tenantId, org_id: orgId, rule_id: rule.id, passed, details });
        evaluations.push({ rule, evaluation });
    }
    await checklist.recomputeCategory({
        orgId, tenantId, category: 'compliance', childStatuses: evaluations.map(({ rule, evaluation }) => outcomeStatus(rule, evaluation.passed)),
    });
    return evaluations;
}

async function latestEvaluations(orgId) {
    const rules = await db.ComplianceRule.findAll({ where: { is_active: true } });
    const results = [];
    for (const rule of rules) {
        const evaluation = await db.ComplianceRuleEvaluation.findOne({ where: { org_id: orgId, rule_id: rule.id }, order: [['evaluated_at', 'DESC']] });
        results.push({ rule, evaluation });
    }
    return results;
}

module.exports = { evaluateAll, evaluateRule, latestEvaluations, outcomeStatus };
