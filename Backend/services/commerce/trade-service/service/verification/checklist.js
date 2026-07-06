'use strict';
// Verification Center rollup engine (Phase 2 Trust/Verification/Compliance
// Foundation). Every verification module (identity, company, tax, bank, address,
// facilities, products, documents, compliance, risk, trust score) calls
// `recomputeCategory` after any state change on its own rows; this module owns the
// single denormalized `verification_checklist_items` row per org/category that the
// Verification Center dashboard reads.
const db = require('../../models');

const { CATEGORIES } = db.VerificationChecklistItem;

async function ensureItem(orgId, category, tenantId) {
    const [item] = await db.VerificationChecklistItem.findOrCreate({
        where: { org_id: orgId, category },
        defaults: { tenant_id: tenantId || 'T-DEMO', org_id: orgId, category, status: 'not_started' },
    });
    return item;
}

async function getChecklist(orgId, tenantId) {
    return Promise.all(CATEGORIES.map((category) => ensureItem(orgId, category, tenantId)));
}

/**
 * Roll up a set of child-row statuses (e.g. every bank_account or facility row for
 * an org) into the single category-level status.
 * @param {string[]} childStatuses
 * @returns {string}
 */
function aggregateStatus(childStatuses) {
    if (!childStatuses.length) return 'not_started';
    if (childStatuses.some((s) => s === 'rejected')) return 'rejected';
    if (childStatuses.every((s) => s === 'approved')) return 'approved';
    if (childStatuses.some((s) => s === 'expired')) return 'expired';
    if (childStatuses.some((s) => s === 'under_review')) return 'under_review';
    return 'submitted';
}

/**
 * Recompute and persist one category's rollup row for an org.
 * @param {{orgId:number, tenantId?:string, category:string, childStatuses:string[], reviewedBy?:string|null, rejectionReason?:string|null, expiresAt?:Date|null}} input
 */
async function recomputeCategory({ orgId, tenantId, category, childStatuses, reviewedBy = null, rejectionReason = null, expiresAt = null }) {
    if (!CATEGORIES.includes(category)) throw new Error(`Unknown verification category "${category}"`);
    const status = aggregateStatus(childStatuses);
    const item = await ensureItem(orgId, category, tenantId);
    const previousStatus = item.status;
    const now = new Date();
    await item.update({
        status,
        item_count: childStatuses.length,
        approved_count: childStatuses.filter((s) => s === 'approved').length,
        last_submitted_at: childStatuses.length ? now : item.last_submitted_at,
        last_reviewed_at: reviewedBy ? now : item.last_reviewed_at,
        reviewed_by: reviewedBy || item.reviewed_by,
        rejection_reason: rejectionReason,
        expires_at: expiresAt,
    });
    // Fire-and-forget — many callers (e.g. the Verification Center GET handler)
    // recompute on every read, so this only actually notifies on a real transition.
    require('./notify').notifyChecklistTransition(orgId, category, previousStatus, status).catch(() => {});
    // Recomputed inline (not fire-and-forget) so the badge is always consistent
    // with the checklist state a caller just read/wrote — this is the one place
    // every module already funnels through, so it needs no extra wiring per module.
    await require('./badge').recomputeBadge(orgId).catch(() => {});
    return item;
}

/** True once every category has reached 'approved'. */
function isFullyVerified(items) {
    return CATEGORIES.every((category) => {
        const item = items.find((i) => i.category === category);
        return item && item.status === 'approved';
    });
}

module.exports = { CATEGORIES, ensureItem, getChecklist, aggregateStatus, recomputeCategory, isFullyVerified };
