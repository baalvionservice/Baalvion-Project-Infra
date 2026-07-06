'use strict';
// Document Verification wiring (Phase 2, Step 9). Owns the 'documents' checklist
// category — NOT a new document store. It rolls up the status of every
// tradeops.documents row already referenced by this org's verification records
// (identity ID/selfie, tax certificate, bank letter, address evidence, product
// certificate, facility media) through the existing AES-256-GCM Document
// Management engine (migrations 011/025).
const db = require('../../models');
const checklist = require('./checklist');

// TradeDocument.status → checklist status vocabulary.
const STATUS_MAP = {
    draft: 'submitted',
    scanning: 'submitted',
    available: 'under_review',
    quarantined: 'rejected',
    rejected: 'rejected',
    verified: 'approved',
    archived: 'expired',
    expired: 'expired',
};

async function collectDocumentIds(orgId) {
    const ids = new Set();

    const identities = await db.IdentityVerification.findAll({ where: { org_id: orgId }, attributes: ['id_document_id', 'selfie_document_id'] });
    identities.forEach((r) => { if (r.id_document_id) ids.add(r.id_document_id); if (r.selfie_document_id) ids.add(r.selfie_document_id); });

    const taxRegs = await db.TaxRegistration.findAll({ where: { org_id: orgId }, attributes: ['document_id'] });
    taxRegs.forEach((r) => { if (r.document_id) ids.add(r.document_id); });

    const banks = await db.BankAccount.unscoped().findAll({ where: { org_id: orgId }, attributes: ['document_id'] });
    banks.forEach((r) => { if (r.document_id) ids.add(r.document_id); });

    const addresses = await db.VerifiedAddress.findAll({ where: { org_id: orgId }, attributes: ['id'] });
    if (addresses.length) {
        const evidence = await db.AddressEvidence.findAll({ where: { address_id: addresses.map((a) => a.id) }, attributes: ['document_id'] });
        evidence.forEach((r) => { if (r.document_id) ids.add(r.document_id); });
    }

    const certs = await db.ProductCertificate.findAll({ where: { org_id: orgId }, attributes: ['document_id'] });
    certs.forEach((r) => { if (r.document_id) ids.add(r.document_id); });

    return [...ids];
}

async function recomputeDocuments(orgId, tenantId) {
    const documentIds = await collectDocumentIds(orgId);
    const docs = documentIds.length ? await db.TradeDocument.findAll({ where: { id: documentIds } }) : [];
    const childStatuses = docs.map((d) => STATUS_MAP[d.status] || 'submitted');
    return checklist.recomputeCategory({ orgId, tenantId, category: 'documents', childStatuses });
}

module.exports = { STATUS_MAP, collectDocumentIds, recomputeDocuments };
