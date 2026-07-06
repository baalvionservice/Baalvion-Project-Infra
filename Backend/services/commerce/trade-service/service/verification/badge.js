'use strict';
// Verified Badge (Phase 2, Step 20) — the final rollup: an org earns the badge
// once every checklist category is approved, its current trust score clears the
// bar, and it has no open/confirmed high-or-critical fraud signal. Recomputed from
// the same central chokepoint every other module already calls
// (checklist.recomputeCategory), so it stays fresh without extra wiring.
const db = require('../../models');
const checklist = require('./checklist');

const MIN_TRUST_SCORE = 60;

async function hasBlockingFraudSignal(orgId) {
    const count = await db.FraudSignal.count({
        where: { org_id: orgId, status: ['open', 'confirmed'], severity: ['high', 'critical'] },
    });
    return count > 0;
}

async function recomputeBadge(orgId) {
    const org = await db.Organization.findByPk(orgId);
    if (!org) return null;

    const items = await checklist.getChecklist(orgId, org.tenant_id);
    const fullyVerified = checklist.isFullyVerified(items);
    const trustScore = await db.TrustScore.findOne({ where: { org_id: orgId, is_current: true } });
    const scorePasses = Boolean(trustScore) && trustScore.score >= MIN_TRUST_SCORE;
    const noBlockingFraud = !(await hasBlockingFraudSignal(orgId));

    const eligible = fullyVerified && scorePasses && noBlockingFraud;
    const alreadyBadged = org.verified_badge;

    if (eligible && !alreadyBadged) {
        await org.update({ verified_badge: true, badge_issued_at: new Date() });
    } else if (!eligible && alreadyBadged) {
        await org.update({ verified_badge: false, badge_issued_at: null });
    }

    return { eligible, fullyVerified, scorePasses, noBlockingFraud, trustScore: trustScore ? trustScore.score : null };
}

// Phase 1 integration surface (Step 20): additive summary attached to the
// existing organization read endpoint — badge/trust score/risk level/reputation,
// no new workflow, no change to the existing response shape's other fields.
async function getPublicSummary(orgId) {
    const [trustScore, risk, reputationSummaries] = await Promise.all([
        db.TrustScore.findOne({ where: { org_id: orgId, is_current: true } }),
        db.OrgRiskAssessment.findOne({ where: { org_id: orgId, is_current: true } }),
        db.ReputationSummary.findAll({ where: { org_id: orgId } }),
    ]);
    return {
        trust_score: trustScore ? trustScore.score : null,
        risk_level: risk ? risk.risk_level : null,
        reputation: reputationSummaries.map((s) => ({ role: s.role, avg_rating: Number(s.avg_rating), total_ratings: s.total_ratings })),
    };
}

module.exports = { MIN_TRUST_SCORE, recomputeBadge, hasBlockingFraudSignal, getPublicSummary };
