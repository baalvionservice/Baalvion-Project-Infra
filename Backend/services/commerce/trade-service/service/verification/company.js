'use strict';
// Company Verification + Director/Beneficial-Owner Verification business logic
// (Phase 2, Step 3). Owns recompute of the 'company' and 'directors' checklist
// categories.
const db = require('../../models');
const config = require('../../config/appConfig');
const checklist = require('./checklist');
const fraud = require('./fraud');

async function recomputeCompany(orgId, tenantId) {
    const record = await db.CompanyVerification.findOne({ where: { org_id: orgId } });
    return checklist.recomputeCategory({
        orgId, tenantId, category: 'company', childStatuses: record ? [record.status] : [],
        reviewedBy: record ? record.reviewed_by : null, rejectionReason: record ? record.rejection_reason : null,
        // Feed the renewal date into the checklist rollup so monitor.js's expiry sweep sees it.
        expiresAt: record ? record.renewal_due_at : null,
    });
}

async function recomputeDirectors(orgId, tenantId) {
    const rows = await db.CompanyStakeholder.findAll({ where: { org_id: orgId } });
    return checklist.recomputeCategory({ orgId, tenantId, category: 'directors', childStatuses: rows.map((r) => r.status) });
}

async function submitCompanyVerification({ orgId, tenantId, actor, ...fields }) {
    const existing = await db.CompanyVerification.findOne({ where: { org_id: orgId } });
    const payload = {
        ...fields,
        tenant_id: tenantId,
        status: 'submitted',
        submitted_at: new Date(),
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        updated_by: actor,
    };
    const record = existing
        ? await existing.update(payload)
        : await db.CompanyVerification.create({ ...payload, org_id: orgId, created_by: actor });
    if (record.registration_number) {
        fraud.checkDuplicateCompany(orgId, tenantId, record.registration_number).catch((err) => console.error('[fraud] checkDuplicateCompany failed:', err.message));
    }

    // Hand the case to the configured KYB vendor, if one is configured. With none,
    // this is a no-op and the record stays in the human queue — see providerCheck.js.
    await require('./providerCheck').dispatch('company', record, {
        recordId: record.id, orgId, tenantId,
        legalCompanyName: record.legal_company_name,
        registrationNumber: record.registration_number,
        incorporationDate: record.incorporation_date,
        businessType: record.business_type,
        companyWebsite: record.company_website,
    });

    await recomputeCompany(orgId, tenantId);
    return record;
}

/**
 * Approving without an explicit renewal date applies the configured KYB validity
 * window (config.verification.companyValidityMonths) — annual re-verification is the
 * usual baseline for business verification. Pass `renewalDueAt` to override, or set
 * the config to 0 months to disable renewal for this track.
 */
function defaultRenewalFor(decision) {
    if (decision !== 'approved') return null;
    const months = config.verification.companyValidityMonths;
    if (!months || months <= 0) return null;
    const due = new Date();
    due.setMonth(due.getMonth() + months);
    return due;
}

async function reviewCompanyVerification({ record, decision, reviewedBy, rejectionReason = null, renewalDueAt = undefined }) {
    const resolvedRenewal = renewalDueAt === undefined ? defaultRenewalFor(decision) : renewalDueAt;
    await record.update({
        status: decision,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        renewal_due_at: resolvedRenewal,
        updated_by: reviewedBy,
    });
    await recomputeCompany(record.org_id, record.tenant_id);
    return record;
}

async function addStakeholder({ orgId, tenantId, personName, role, ownershipPercentage = null, identityVerificationId = null, actor }) {
    const record = await db.CompanyStakeholder.create({
        tenant_id: tenantId, org_id: orgId, person_name: personName, role,
        ownership_percentage: ownershipPercentage, identity_verification_id: identityVerificationId,
        status: 'submitted', created_by: actor,
    });
    await recomputeDirectors(orgId, tenantId);
    return record;
}

async function reviewStakeholder({ record, decision, reviewedBy, rejectionReason = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null, updated_by: reviewedBy,
    });
    await recomputeDirectors(record.org_id, record.tenant_id);
    return record;
}

async function removeStakeholder(record) {
    const { org_id: orgId, tenant_id: tenantId } = record;
    await record.destroy();
    await recomputeDirectors(orgId, tenantId);
}

module.exports = {
    recomputeCompany, recomputeDirectors, submitCompanyVerification, reviewCompanyVerification,
    addStakeholder, reviewStakeholder, removeStakeholder,
};
