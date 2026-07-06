'use strict';
/**
 * Trust Score Engine — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 13).
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { fetchOrgOwned, actorOf } = require('../service/verification/access');
const trustScoreSvc = require('../service/verification/trustScore');

const computeTrustScore = async (req, res, next) => {
    try {
        const orgId = Number(req.body ? req.body.org_id : NaN);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const result = await trustScoreSvc.computeTrustScore(orgId, org.tenant_id);

        await recordAudit({
            actorId: actorOf(req), action: 'trust_score.computed', resourceType: 'organization',
            resourceId: orgId, tenantId: org.tenant_id, metadata: { score: result.score },
        });

        return sendSuccess(req, res, { org_id: orgId, score: result.score, breakdown: result.breakdown });
    } catch (err) {
        return next(err);
    }
};

const getCurrentTrustScore = async (req, res, next) => {
    try {
        const orgId = Number(req.query.org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const current = await trustScoreSvc.getCurrentTrustScore(orgId);
        if (!current) return next(new AppError('NOT_FOUND', 'No trust score on file — POST /v1/trust_scores/compute first', 404));
        return sendSuccess(req, res, current);
    } catch (err) {
        return next(err);
    }
};

const listTrustScoreHistory = async (req, res, next) => {
    try {
        const orgId = Number(req.query.org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;
        const rows = await db.TrustScore.findAll({ where: { org_id: orgId }, order: [['computed_at', 'DESC']], limit: 50 });
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

module.exports = { computeTrustScore, getCurrentTrustScore, listTrustScoreHistory };
