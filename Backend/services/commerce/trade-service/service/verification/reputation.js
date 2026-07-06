'use strict';
// Reputation System business logic (Phase 2, Step 14). Recomputes the per-org-
// per-role summary after every new rating — this is a display/scoring metric
// (order completion, response times, dispute outcomes), not a Verification Center
// checklist category.
const db = require('../../models');

async function recomputeSummary(orgId, role, tenantId) {
    const ratings = await db.ReputationRating.findAll({ where: { ratee_org_id: orgId, role } });
    const total = ratings.length;
    const avgRating = total ? ratings.reduce((sum, r) => sum + r.rating_value, 0) / total : 0;
    const withResponseTime = ratings.filter((r) => r.response_time_seconds != null);
    const avgResponseTime = withResponseTime.length
        ? Math.round(withResponseTime.reduce((sum, r) => sum + r.response_time_seconds, 0) / withResponseTime.length)
        : null;
    const disputed = ratings.filter((r) => r.dispute_outcome != null).length;
    const completedOrders = new Set(ratings.filter((r) => r.order_id).map((r) => r.order_id)).size;

    const [summary] = await db.ReputationSummary.findOrCreate({
        where: { org_id: orgId, role },
        defaults: { tenant_id: tenantId, org_id: orgId, role },
    });
    await summary.update({
        avg_rating: Number(avgRating.toFixed(2)),
        total_ratings: total,
        completed_orders: completedOrders,
        avg_response_time: avgResponseTime,
        dispute_rate: total ? Number((disputed / total).toFixed(4)) : 0,
        computed_at: new Date(),
    });
    return summary;
}

async function submitRating({ ratedOrgId, role, tenantId, raterOrgId = null, raterUserId = null, orderId = null, ratingValue, responseTimeSeconds = null, disputeOutcome = null, comment = null }) {
    const rating = await db.ReputationRating.create({
        tenant_id: tenantId, rater_org_id: raterOrgId, rater_user_id: raterUserId, ratee_org_id: ratedOrgId,
        role, order_id: orderId, rating_value: ratingValue, response_time_seconds: responseTimeSeconds,
        dispute_outcome: disputeOutcome, comment,
    });
    await recomputeSummary(ratedOrgId, role, tenantId);
    return rating;
}

module.exports = { recomputeSummary, submitRating };
