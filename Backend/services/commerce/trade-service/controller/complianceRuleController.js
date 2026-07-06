'use strict';
/**
 * Compliance Engine — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 10). Rule definitions are admin-managed config; evaluation is
 * triggered per org and recomputes the 'compliance' checklist category.
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, actorOf } = require('../service/verification/access');
const complianceRulesSvc = require('../service/verification/complianceRules');
const { ComplianceRule } = db;

const listRules = async (req, res, next) => {
    try {
        const { is_active } = req.query;
        const where = {};
        if (is_active !== undefined) where.is_active = is_active === 'true';
        const rows = await ComplianceRule.findAll({ where, order: [['category', 'ASC'], ['rule_code', 'ASC']] });
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

const createRule = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin role required', 403));
        const { rule_code, category, description = null, condition, severity = 'warning', is_active = true } = req.body || {};
        if (!rule_code || !condition || !condition.type) {
            return next(new AppError('VALIDATION_ERROR', '`rule_code` and `condition.type` are required', 422));
        }
        if (!category || !ComplianceRule.CATEGORIES.includes(category)) {
            return next(new AppError('INVALID_CATEGORY', '`category` is required', 422, { allowed: ComplianceRule.CATEGORIES }));
        }
        if (!ComplianceRule.SEVERITIES.includes(severity)) {
            return next(new AppError('INVALID_SEVERITY', 'Invalid `severity`', 422, { allowed: ComplianceRule.SEVERITIES }));
        }
        const rule = await ComplianceRule.create({ rule_code, category, description, condition, severity, is_active });
        await recordAudit({ actorId: actorOf(req), action: 'compliance_rule.created', resourceType: 'compliance_rule', resourceId: rule.id, tenantId: 'GLOBAL', metadata: { ruleCode: rule_code } });
        return sendSuccess(req, res, rule, 201);
    } catch (err) {
        return next(err);
    }
};

const updateRule = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin role required', 403));
        const rule = await ComplianceRule.findByPk(req.params.id);
        if (!rule) return next(new AppError('NOT_FOUND', 'Compliance rule not found', 404));
        const { description, condition, severity, is_active } = req.body || {};
        if (severity !== undefined && !ComplianceRule.SEVERITIES.includes(severity)) {
            return next(new AppError('INVALID_SEVERITY', 'Invalid `severity`', 422, { allowed: ComplianceRule.SEVERITIES }));
        }
        await rule.update({
            description: description !== undefined ? description : rule.description,
            condition: condition !== undefined ? condition : rule.condition,
            severity: severity !== undefined ? severity : rule.severity,
            is_active: is_active !== undefined ? is_active : rule.is_active,
        });
        await recordAudit({ actorId: actorOf(req), action: 'compliance_rule.updated', resourceType: 'compliance_rule', resourceId: rule.id, tenantId: 'GLOBAL', metadata: {} });
        return sendSuccess(req, res, rule);
    } catch (err) {
        return next(err);
    }
};

const evaluateOrg = async (req, res, next) => {
    try {
        const orgId = Number(req.body ? req.body.org_id : NaN);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const results = await complianceRulesSvc.evaluateAll(orgId, org.tenant_id);
        await recordAudit({
            actorId: actorOf(req), action: 'compliance_rules.evaluated', resourceType: 'organization',
            resourceId: orgId, tenantId: org.tenant_id, metadata: { ruleCount: results.length },
        });
        return sendSuccess(req, res, results.map(({ rule, evaluation }) => ({
            rule_code: rule.rule_code, category: rule.category, severity: rule.severity,
            passed: evaluation.passed, details: evaluation.details, evaluated_at: evaluation.evaluated_at,
        })));
    } catch (err) {
        return next(err);
    }
};

const getEvaluations = async (req, res, next) => {
    try {
        const orgId = Number(req.query.org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const results = await complianceRulesSvc.latestEvaluations(orgId);
        return sendSuccess(req, res, results.map(({ rule, evaluation }) => ({
            rule_code: rule.rule_code, category: rule.category, severity: rule.severity,
            passed: evaluation ? evaluation.passed : null, details: evaluation ? evaluation.details : null,
            evaluated_at: evaluation ? evaluation.evaluated_at : null,
        })));
    } catch (err) {
        return next(err);
    }
};

module.exports = { listRules, createRule, updateRule, evaluateOrg, getEvaluations };
