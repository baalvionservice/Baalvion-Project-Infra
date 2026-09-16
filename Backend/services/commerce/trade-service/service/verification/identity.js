'use strict';
// Identity Verification business logic (Phase 2, Step 2). Thin over the model;
// owns the one place that also recomputes the org's 'identity' checklist category
// when a submission carries an org_id.
const db = require('../../models');
const config = require('../../config/appConfig');
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

    // Hand the case to the configured KYC vendor, if one is configured. With none,
    // this is a no-op and the record stays in the human queue — see providerCheck.js.
    await require('./providerCheck').dispatch('identity', record, {
        recordId: record.id, fullName, dateOfBirth, nationality, idType,
        idNumberLast4, idDocumentId, selfieDocumentId, tenantId, orgId,
    });

    if (record.org_id) await recomputeForOrg(record.org_id, record.tenant_id);
    return record;
}

async function setLiveness({ identityVerification, status, provider = null, reference = null }) {
    await identityVerification.update({ liveness_check_status: status, liveness_provider: provider, liveness_reference: reference });
    return identityVerification;
}

/**
 * Approving without an explicit expiry applies the configured validity window
 * (config.verification.identityValidityMonths) rather than leaving the record valid
 * forever — periodic re-verification is standard AML practice. A reviewer can still
 * pass `expiresAt` to override, and a 0-month config disables expiry entirely.
 * Only approvals get an expiry; a rejected record has nothing to expire.
 */
function defaultExpiryFor(decision) {
    if (decision !== 'approved') return null;
    const months = config.verification.identityValidityMonths;
    if (!months || months <= 0) return null;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
}

async function review({ identityVerification, decision, reviewedBy, rejectionReason = null, expiresAt = undefined }) {
    const resolvedExpiry = expiresAt === undefined ? defaultExpiryFor(decision) : expiresAt;
    await identityVerification.update({
        status: decision,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        expires_at: resolvedExpiry,
        updated_by: reviewedBy,
    });
    if (identityVerification.org_id) await recomputeForOrg(identityVerification.org_id, identityVerification.tenant_id);
    return identityVerification;
}

async function recomputeForOrg(orgId, tenantId) {
    const rows = await db.IdentityVerification.findAll({ where: { org_id: orgId } });
    // Carry the soonest expiry up to the checklist rollup so monitor.js's sweep
    // (which only reads verification_checklist_items.expires_at) can actually fire.
    const expiries = rows.map((r) => r.expires_at).filter(Boolean).map((d) => new Date(d));
    const soonestExpiry = expiries.length ? new Date(Math.min(...expiries.map((d) => d.getTime()))) : null;
    return checklist.recomputeCategory({
        orgId, tenantId, category: 'identity', childStatuses: rows.map((r) => r.status), expiresAt: soonestExpiry,
    });
}

module.exports = { submit, setLiveness, review, recomputeForOrg };
