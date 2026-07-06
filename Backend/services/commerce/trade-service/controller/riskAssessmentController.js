'use strict';
/**
 * Risk Assessment Engine — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 12).
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { fetchOrgOwned, actorOf } = require('../service/verification/access');
const riskSvc = require('../service/verification/risk');

const computeRiskAssessment = async (req, res, next) => {
    try {
        const orgId = Number(req.body ? req.body.org_id : NaN);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const result = await riskSvc.computeRisk(orgId, org.tenant_id);

        await recordAudit({
            actorId: actorOf(req), action: 'risk_assessment.computed', resourceType: 'organization',
            resourceId: orgId, tenantId: org.tenant_id, metadata: { riskLevel: result.riskLevel, score: result.score },
        });

        return sendSuccess(req, res, { org_id: orgId, risk_level: result.riskLevel, score: result.score, factors: result.factors });
    } catch (err) {
        return next(err);
    }
};

const getCurrentRiskAssessment = async (req, res, next) => {
    try {
        const orgId = Number(req.query.org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const current = await riskSvc.getCurrentRisk(orgId);
        if (!current) return next(new AppError('NOT_FOUND', 'No risk assessment on file — POST /v1/risk_assessments/compute first', 404));
        return sendSuccess(req, res, current);
    } catch (err) {
        return next(err);
    }
};

const listRiskHistory = async (req, res, next) => {
    try {
        const orgId = Number(req.query.org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const rows = await db.OrgRiskAssessment.findAll({ where: { org_id: orgId }, order: [['computed_at', 'DESC']], limit: 50 });
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

module.exports = { computeRiskAssessment, getCurrentRiskAssessment, listRiskHistory };
