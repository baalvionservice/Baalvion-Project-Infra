'use strict';
// Address Verification business logic (Phase 2, Step 6). Owns the 'address'
// checklist category, computed from registered_office/corporate_office/branch
// rows only — factory/warehouse rows feed the 'factory'/'warehouse' categories via
// the Facilities module (Step 7) instead, since those are a richer profile than a
// bare address.
const db = require('../../models');
const checklist = require('./checklist');

const ADDRESS_CATEGORY_TYPES = ['registered_office', 'corporate_office', 'branch'];

async function recomputeAddress(orgId, tenantId) {
    const rows = await db.VerifiedAddress.findAll({ where: { org_id: orgId, address_type: ADDRESS_CATEGORY_TYPES } });
    return checklist.recomputeCategory({ orgId, tenantId, category: 'address', childStatuses: rows.map((r) => r.status) });
}

async function submitAddress({ orgId, tenantId, addressType, line1, line2 = null, city = null, state = null, postalCode = null, country = null, latitude = null, longitude = null, actor }) {
    const record = await db.VerifiedAddress.create({
        tenant_id: tenantId, org_id: orgId, address_type: addressType, line1, line2, city, state,
        postal_code: postalCode, country, latitude, longitude, status: 'submitted', created_by: actor,
    });
    if (ADDRESS_CATEGORY_TYPES.includes(addressType)) await recomputeAddress(orgId, tenantId);
    return record;
}

async function attachEvidence({ addressId, documentId, evidenceType, tenantId, actor }) {
    return db.AddressEvidence.create({ tenant_id: tenantId, address_id: addressId, document_id: documentId, evidence_type: evidenceType, created_by: actor });
}

async function reviewAddress({ record, decision, reviewedBy, rejectionReason = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null, updated_by: reviewedBy,
    });
    if (ADDRESS_CATEGORY_TYPES.includes(record.address_type)) await recomputeAddress(record.org_id, record.tenant_id);
    return record;
}

module.exports = { ADDRESS_CATEGORY_TYPES, recomputeAddress, submitAddress, attachEvidence, reviewAddress };
