'use strict';
// Risk Assessment Engine business logic (Phase 2, Step 12). Computes a 0-100 risk
// score (higher = worse) from verification completion, company age, trading
// history, dispute history, compliance status, document validity and open fraud
// signals, then maps it to a risk_level and recomputes the 'risk' checklist
// category. Reuses only data that already exists in this system — no fabricated
// cross-domain assumptions.
const db = require('../../models');
const checklist = require('./checklist');

const NON_RISK_CATEGORIES = checklist.CATEGORIES.filter((c) => c !== 'risk' && c !== 'trust_score');

async function gatherFactors(orgId) {
    const org = await db.Organization.findByPk(orgId);
    const items = await db.VerificationChecklistItem.findAll({ where: { org_id: orgId, category: NON_RISK_CATEGORIES } });
    const approvedCount = items.filter((i) => i.status === 'approved').length;
    const verificationCompletion = NON_RISK_CATEGORIES.length ? approvedCount / NON_RISK_CATEGORIES.length : 0;

    const companyAgeDays = org && org.createdAt ? Math.floor((Date.now() - new Date(org.createdAt).getTime()) / 86400000) : 0;

    let tradingHistoryCount = 0;
    let disputeHistoryCount = 0;
    if (org && org.code) {
        const { Op } = db.Sequelize;
        tradingHistoryCount = await db.Order.count({ where: { [Op.or]: [{ buyer_org_id: org.code }, { seller_org_id: org.code }] } });
        disputeHistoryCount = await db.Dispute.count({ where: { [Op.or]: [{ claimant_org_id: org.code }, { respondent_org_id: org.code }] } });
    }

    const complianceItem = items.find((i) => i.category === 'compliance');
    const documentsItem = items.find((i) => i.category === 'documents');
    const openFraudSignals = await db.FraudSignal.count({ where: { org_id: orgId, status: ['open', 'reviewing'] } });

    return {
        verification_completion: Number(verificationCompletion.toFixed(2)),
        company_age_days: companyAgeDays,
        trading_history_count: tradingHistoryCount,
        dispute_history_count: disputeHistoryCount,
        compliance_status: complianceItem ? complianceItem.status : 'not_started',
        document_validity: documentsItem ? documentsItem.status : 'not_started',
        open_fraud_signals: openFraudSignals,
    };
}

/** Weighted 0-100 badness score — higher is riskier. */
function scoreFromFactors(f) {
    let score = 0;
    score += (1 - f.verification_completion) * 35;                                   // incomplete verification is the biggest driver
    score += f.company_age_days < 30 ? 15 : f.company_age_days < 180 ? 8 : 0;         // very new companies carry more risk
    score += f.trading_history_count === 0 ? 10 : Math.max(0, 10 - f.trading_history_count); // no track record yet
    score += Math.min(f.dispute_history_count * 8, 20);                              // disputes compound quickly
    score += f.compliance_status === 'rejected' ? 20 : f.compliance_status === 'under_review' ? 8 : 0;
    score += f.document_validity === 'rejected' ? 10 : f.document_validity === 'expired' ? 10 : 0;
    score += Math.min(f.open_fraud_signals * 15, 30);                                // open fraud signals dominate
    return Math.max(0, Math.min(100, Math.round(score)));
}

function levelFromScore(score) {
    if (score >= 70) return 'critical';
    if (score >= 45) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
}

/** risk_level → checklist status: this category gates further trust progression. */
function checklistStatusFromLevel(level) {
    if (level === 'critical') return 'rejected';
    if (level === 'high') return 'under_review';
    return 'approved'; // low/medium — acceptable operating risk
}

async function computeRisk(orgId, tenantId) {
    const factors = await gatherFactors(orgId);
    const score = scoreFromFactors(factors);
    const riskLevel = levelFromScore(score);

    await db.sequelize.transaction(async (t) => {
        await db.OrgRiskAssessment.update({ is_current: false }, { where: { org_id: orgId, is_current: true }, transaction: t });
        await db.OrgRiskAssessment.create({ tenant_id: tenantId, org_id: orgId, risk_level: riskLevel, score, factors, is_current: true }, { transaction: t });
    });

    await checklist.recomputeCategory({ orgId, tenantId, category: 'risk', childStatuses: [checklistStatusFromLevel(riskLevel)] });
    return { riskLevel, score, factors };
}

async function getCurrentRisk(orgId) {
    return db.OrgRiskAssessment.findOne({ where: { org_id: orgId, is_current: true } });
}

module.exports = { gatherFactors, scoreFromFactors, levelFromScore, checklistStatusFromLevel, computeRisk, getCurrentRisk };
