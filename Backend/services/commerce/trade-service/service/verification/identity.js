'use strict';
// Identity Verification business logic (Phase 2, Step 2). Thin over the model;
// owns the one place that also recomputes the org's 'identity' checklist category
// when a submission carries an org_id.
const db = require('../../models');
const checklist = require('./checklist');
const fraud = require('./fraud');

/**
 * Create or resubmit a user's identity verification. Only one active (non-deleted)
 * row exists per user — a resubmission after rejection updates that row back to
 * 'submitted' rather than creating a duplicate.
 */
async function submit({ userId, orgId = null, tenantId, fullName, dateOfBirth = null, nationality = null, idType, idNumberLast4 = null, idDocumentId = null, selfieDocumentId = null, actor }) {
    const existing = await db.IdentityVerification.findOne({ where: { user_id: userId } });
    const fields = {
        tenant_id: tenantId,
        org_id: orgId,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        nationality,
        id_type: idType,
        id_number_last4: idNumberLast4,
        id_document_id: idDocumentId,
        selfie_document_id: selfieDocumentId,
        liveness_check_status: 'pending',
        status: 'submitted',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        updated_by: actor,
    };

    const record = existing
        ? await existing.update(fields)
        : await db.IdentityVerification.create({ ...fields, user_id: userId, created_by: actor });

    fraud.checkMultiAccountSameIdentity(userId, record.tenant_id, orgId, { fullName, dateOfBirth, nationality })
        .catch((err) => console.error('[fraud] checkMultiAccountSameIdentity failed:', err.message));

    if (record.org_id) await recomputeForOrg(record.org_id, record.tenant_id);
    return record;
}

async function setLiveness({ identityVerification, status, provider = null, reference = null }) {
    await identityVerification.update({ liveness_check_status: status, liveness_provider: provider, liveness_reference: reference });
    return identityVerification;
}

async function review({ identityVerification, decision, reviewedBy, rejectionReason = null, expiresAt = null }) {
    await identityVerification.update({
        status: decision,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        expires_at: expiresAt,
        updated_by: reviewedBy,
    });
    if (identityVerification.org_id) await recomputeForOrg(identityVerification.org_id, identityVerification.tenant_id);
    return identityVerification;
}

async function recomputeForOrg(orgId, tenantId) {
    const rows = await db.IdentityVerification.findAll({ where: { org_id: orgId } });
    return checklist.recomputeCategory({
        orgId, tenantId, category: 'identity', childStatuses: rows.map((r) => r.status),
    });
}

module.exports = { submit, setLiveness, review, recomputeForOrg };
