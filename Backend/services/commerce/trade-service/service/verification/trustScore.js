'use strict';
// Trust Score Engine business logic (Phase 2, Step 13). Weighted composite of
// identity/company/bank/compliance/trading-history/feedback/document-health/risk,
// each normalized to 0-100, recomputed whenever any verification/compliance/risk/
// reputation state changes. The 'trust_score' checklist category is marked
// 'approved' once any score has been computed — the number itself (not a workflow
// decision) is what downstream consumers (badge, dashboard) act on.
const db = require('../../models');
const checklist = require('./checklist');
const riskSvc = require('./risk');

const WEIGHTS = {
    identity: 0.15, company: 0.15, bank: 0.10, compliance: 0.20,
    trading_history: 0.10, feedback: 0.10, document_health: 0.10, risk: 0.10,
};

// checklist-item status → 0-100 component score.
function statusScore(status) {
    if (status === 'approved') return 100;
    if (status === 'under_review' || status === 'submitted') return 50;
    return 0; // not_started / rejected / expired
}

async function componentFromCategory(orgId, category) {
    const item = await db.VerificationChecklistItem.findOne({ where: { org_id: orgId, category } });
    return statusScore(item ? item.status : 'not_started');
}

async function tradingHistoryComponent(orgId) {
    const factors = await riskSvc.gatherFactors(orgId);
    return Math.min(factors.trading_history_count * 10, 100);
}

async function riskComponent(orgId) {
    const current = await riskSvc.getCurrentRisk(orgId);
    return current ? 100 - Number(current.score) : 50; // no assessment yet → neutral
}

// Forward-compatible with Step 14 (Reputation System) — db.ReputationSummary
// doesn't exist until that migration lands; until then every org gets a neutral
// feedback score rather than penalizing orgs with no ratings yet.
async function feedbackComponent(orgId) {
    if (!db.ReputationSummary) return 70;
    const summaries = await db.ReputationSummary.findAll({ where: { org_id: orgId } });
    if (!summaries.length) return 70;
    const avg = summaries.reduce((sum, s) => sum + Number(s.avg_rating || 0), 0) / summaries.length;
    return Math.round((avg / 5) * 100);
}

async function computeBreakdown(orgId) {
    const [identity, company, bank, compliance, documentHealth, tradingHistory, risk, feedback] = await Promise.all([
        componentFromCategory(orgId, 'identity'),
        componentFromCategory(orgId, 'company'),
        componentFromCategory(orgId, 'bank'),
        componentFromCategory(orgId, 'compliance'),
        componentFromCategory(orgId, 'documents'),
        tradingHistoryComponent(orgId),
        riskComponent(orgId),
        feedbackComponent(orgId),
    ]);
    return { identity, company, bank, compliance, document_health: documentHealth, trading_history: tradingHistory, risk, feedback };
}

function weightedScore(breakdown) {
    const total = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + breakdown[key] * weight, 0);
    return Math.max(0, Math.min(100, Math.round(total)));
}

async function computeTrustScore(orgId, tenantId) {
    const breakdown = await computeBreakdown(orgId);
    const score = weightedScore(breakdown);

    await db.sequelize.transaction(async (t) => {
        await db.TrustScore.update({ is_current: false }, { where: { org_id: orgId, is_current: true }, transaction: t });
        await db.TrustScore.create({ tenant_id: tenantId, org_id: orgId, score, breakdown, is_current: true }, { transaction: t });
    });

    await checklist.recomputeCategory({ orgId, tenantId, category: 'trust_score', childStatuses: ['approved'] });
    // The checklist category only ever reflects "computed" vs not, so the actual
    // "score changed" event is notified directly here rather than relying on the
    // (unchanging) checklist status transition.
    require('./notify').notifyTrustScoreUpdated(orgId, score).catch(() => {});
    return { score, breakdown };
}

async function getCurrentTrustScore(orgId) {
    return db.TrustScore.findOne({ where: { org_id: orgId, is_current: true } });
}

module.exports = { WEIGHTS, computeBreakdown, weightedScore, computeTrustScore, getCurrentTrustScore };
