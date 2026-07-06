'use strict';
// Tax Verification business logic (Phase 2, Step 4). Owns the 'tax' checklist
// category recompute + tax_id_value format validation against the configured
// country/type regex.
const db = require('../../models');
const checklist = require('./checklist');
const fraud = require('./fraud');

async function recomputeTax(orgId, tenantId) {
    const rows = await db.TaxRegistration.findAll({ where: { org_id: orgId } });
    return checklist.recomputeCategory({ orgId, tenantId, category: 'tax', childStatuses: rows.map((r) => r.status) });
}

/** Returns null when valid, or an error message string. */
function validateFormat(taxIdType, value) {
    if (!taxIdType.validation_regex) return null;
    const re = new RegExp(taxIdType.validation_regex);
    if (!re.test(String(value || ''))) return `"${value}" does not match the expected ${taxIdType.type_code} format`;
    return null;
}

async function submitTaxRegistration({ orgId, tenantId, taxIdTypeId, taxIdValue, documentId = null, actor }) {
    const existing = await db.TaxRegistration.findOne({ where: { org_id: orgId, tax_id_type_id: taxIdTypeId } });
    const payload = {
        tax_id_value: taxIdValue, document_id: documentId, status: 'submitted',
        reviewed_by: null, reviewed_at: null, rejection_reason: null, updated_by: actor,
    };
    const record = existing
        ? await existing.update(payload)
        : await db.TaxRegistration.create({ ...payload, tenant_id: tenantId, org_id: orgId, tax_id_type_id: taxIdTypeId, created_by: actor });
    fraud.checkDuplicateTaxId(orgId, tenantId, taxIdTypeId, taxIdValue).catch((err) => console.error('[fraud] checkDuplicateTaxId failed:', err.message));
    await recomputeTax(orgId, tenantId);
    return record;
}

async function reviewTaxRegistration({ record, decision, reviewedBy, rejectionReason = null, expiresAt = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        verified_at: decision === 'approved' ? new Date() : null,
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        expires_at: expiresAt, updated_by: reviewedBy,
    });
    await recomputeTax(record.org_id, record.tenant_id);
    return record;
}

module.exports = { recomputeTax, validateFormat, submitTaxRegistration, reviewTaxRegistration };
