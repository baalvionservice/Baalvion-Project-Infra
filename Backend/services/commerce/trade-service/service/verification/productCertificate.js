'use strict';
// Product & Certificate Verification business logic (Phase 2, Step 8). Owns the
// 'certificates' checklist category. 'products' is a separate, broader category
// (product listings/specs in the marketplace domain, not certificate-specific) and
// is intentionally left for a future product-catalog verification pass — it is not
// populated by this module.
const db = require('../../models');
const checklist = require('./checklist');

async function recomputeCertificates(orgId, tenantId) {
    const rows = await db.ProductCertificate.findAll({ where: { org_id: orgId } });
    return checklist.recomputeCategory({ orgId, tenantId, category: 'certificates', childStatuses: rows.map((r) => r.status) });
}

async function submitCertificate({ orgId, tenantId, productName, hsCodeId = null, certificateType, countryOfOrigin = null, documentId = null, issuedAt = null, expiresAt = null, actor }) {
    const record = await db.ProductCertificate.create({
        tenant_id: tenantId, org_id: orgId, product_name: productName, hs_code_id: hsCodeId,
        certificate_type: certificateType, country_of_origin: countryOfOrigin, document_id: documentId,
        issued_at: issuedAt, expires_at: expiresAt, status: 'submitted', created_by: actor,
    });
    await recomputeCertificates(orgId, tenantId);
    return record;
}

async function reviewCertificate({ record, decision, reviewedBy, rejectionReason = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null, updated_by: reviewedBy,
    });
    await recomputeCertificates(record.org_id, record.tenant_id);
    return record;
}

module.exports = { recomputeCertificates, submitCertificate, reviewCertificate };
