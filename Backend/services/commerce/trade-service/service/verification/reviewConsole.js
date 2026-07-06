'use strict';
// Manual Review Console business logic (Phase 2, Step 15). A thin dispatcher over
// the review functions each verification module already exposes — this is the
// single place reviewers act from, not a parallel workflow engine.
const db = require('../../models');
const identitySvc = require('./identity');
const companySvc = require('./company');
const taxSvc = require('./tax');
const bankSvc = require('./bank');
const addressSvc = require('./address');
const facilitySvc = require('./facility');
const certSvc = require('./productCertificate');

const DECISION_ACTIONS = new Set(['approve', 'reject']);

// reviewable_type -> { model, load(id), applyDecision(record, decision, reviewerUserId, rejectionReason) }
const HANDLERS = {
    identity: {
        model: () => db.IdentityVerification,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            identitySvc.review({ identityVerification: record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    company: {
        model: () => db.CompanyVerification,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            companySvc.reviewCompanyVerification({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    stakeholder: {
        model: () => db.CompanyStakeholder,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            companySvc.reviewStakeholder({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    tax: {
        model: () => db.TaxRegistration,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            taxSvc.reviewTaxRegistration({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    bank: {
        model: () => db.BankAccount,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            bankSvc.reviewBankAccount({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    address: {
        model: () => db.VerifiedAddress,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            addressSvc.reviewAddress({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    facility: {
        model: () => db.Facility,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            facilitySvc.reviewFacility({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    product_certificate: {
        model: () => db.ProductCertificate,
        applyDecision: (record, decision, reviewerUserId, rejectionReason) =>
            certSvc.reviewCertificate({ record, decision: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: reviewerUserId, rejectionReason }),
    },
    document: {
        model: () => db.TradeDocument,
        applyDecision: async (record, decision, reviewerUserId) => {
            await record.update({ status: decision === 'approve' ? 'verified' : 'rejected', updated_by: reviewerUserId });
            return record;
        },
    },
    // compliance_rule evaluations are system-computed, not manually decided — the
    // console can still log request_more_info/escalate against one, just not
    // mutate it directly.
    compliance_rule: {
        model: () => db.ComplianceRuleEvaluation,
        applyDecision: () => { throw new Error('compliance_rule evaluations cannot be directly approved/rejected — they are recomputed by the Compliance Engine'); },
    },
};

async function loadReviewable(reviewableType, reviewableId) {
    const handler = HANDLERS[reviewableType];
    if (!handler) throw new Error(`Unknown reviewable_type "${reviewableType}"`);
    const record = await handler.model().findByPk(reviewableId);
    return { handler, record };
}

/**
 * Record a review decision and, for approve/reject, apply it to the underlying
 * entity via that module's own review function.
 */
async function recordDecision({ reviewableType, reviewableId, action, reviewerUserId, notes = null, escalatedTo = null, orgId = null, tenantId = 'T-DEMO' }) {
    const { handler, record } = await loadReviewable(reviewableType, reviewableId);
    if (!record) throw new Error(`${reviewableType} ${reviewableId} not found`);

    if (DECISION_ACTIONS.has(action)) {
        await handler.applyDecision(record, action, reviewerUserId, notes);
    }

    return db.ReviewAction.create({
        tenant_id: tenantId, org_id: orgId, reviewable_type: reviewableType, reviewable_id: reviewableId,
        action, reviewer_user_id: reviewerUserId, notes, escalated_to: action === 'escalate' ? escalatedTo : null,
    });
}

async function history(reviewableType, reviewableId) {
    return db.ReviewAction.findAll({ where: { reviewable_type: reviewableType, reviewable_id: reviewableId }, order: [['created_at', 'DESC']] });
}

/** Aggregated queue of everything awaiting review across every module. */
async function getQueue({ orgId = null } = {}) {
    const statusFilter = { status: ['submitted', 'under_review'] };
    const scopedWhere = (extra = {}) => ({ ...statusFilter, ...(orgId ? { org_id: orgId } : {}), ...extra });

    const [identities, companies, stakeholders, taxes, banks, addresses, facilities, certificates] = await Promise.all([
        db.IdentityVerification.findAll({ where: scopedWhere() }),
        db.CompanyVerification.findAll({ where: scopedWhere() }),
        db.CompanyStakeholder.findAll({ where: scopedWhere() }),
        db.TaxRegistration.findAll({ where: scopedWhere() }),
        db.BankAccount.findAll({ where: scopedWhere() }),
        db.VerifiedAddress.findAll({ where: scopedWhere() }),
        db.Facility.findAll({ where: scopedWhere() }),
        db.ProductCertificate.findAll({ where: scopedWhere() }),
    ]);

    const normalize = (type, rows) => rows.map((r) => ({
        reviewable_type: type, reviewable_id: r.id, org_id: r.org_id, status: r.status, submitted_at: r.createdAt,
    }));

    return [
        ...normalize('identity', identities),
        ...normalize('company', companies),
        ...normalize('stakeholder', stakeholders),
        ...normalize('tax', taxes),
        ...normalize('bank', banks),
        ...normalize('address', addresses),
        ...normalize('facility', facilities),
        ...normalize('product_certificate', certificates),
    ].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
}

module.exports = { recordDecision, history, getQueue, HANDLERS };
