'use strict';
/**
 * Verification Center — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation). Thin controller: tenant ownership + delegation to the checklist
 * rollup service.
 */
const { sendSuccess } = require('../utils/response');
const { fetchOrgOwned } = require('../service/verification/access');
const checklist = require('../service/verification/checklist');
const documentsSvc = require('../service/verification/documents');

const getVerificationCenter = async (req, res, next) => {
    try {
        const orgId = Number(req.params.orgId);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        // 'documents' has no dedicated submit/review endpoints of its own — it's a
        // rollup of documents already referenced by the other verification records
        // — so recompute it fresh on every read instead of on a write path.
        await documentsSvc.recomputeDocuments(orgId, org.tenant_id);

        const items = await checklist.getChecklist(orgId, org.tenant_id);
        return sendSuccess(req, res, {
            org_id: orgId,
            verified_badge: org.verified_badge,
            badge_issued_at: org.badge_issued_at,
            checklist: items.map((i) => ({
                category: i.category,
                status: i.status,
                item_count: i.item_count,
                approved_count: i.approved_count,
                last_submitted_at: i.last_submitted_at,
                last_reviewed_at: i.last_reviewed_at,
                reviewed_by: i.reviewed_by,
                rejection_reason: i.rejection_reason,
                expires_at: i.expires_at,
            })),
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { getVerificationCenter };
