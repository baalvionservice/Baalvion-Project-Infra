'use strict';
/**
 * Claim evidence gating (migration 066).
 *
 * A marine cargo claim is decided on documents, so an adjuster cannot move one to
 * `approved` until the documentary set for that loss type is attached. Same shape
 * as the KYC checklist gate in service/verification/checklist.js: the requirement
 * is computed from the record, snapshotted onto it at file time so it cannot
 * change under an open claim, and re-evaluated on every attachment.
 *
 * The base set (BL + invoice + packing list) proves title, value and contents.
 * `carrier_claim_letter` is required wherever the carrier may be liable — notice
 * to the carrier within the time bar is what preserves the insurer's subrogation
 * right, so a claim that skips it destroys the recovery it is entitled to.
 */
const db = require('../../models');

const BASE = ['bill_of_lading', 'commercial_invoice', 'packing_list'];

const REQUIRED_BY_LOSS_TYPE = {
    total_loss: [...BASE, 'non_delivery_certificate', 'carrier_claim_letter'],
    partial_loss: [...BASE, 'survey_report', 'photo_evidence', 'carrier_claim_letter'],
    damage: [...BASE, 'survey_report', 'photo_evidence', 'carrier_claim_letter'],
    theft: [...BASE, 'police_report', 'carrier_claim_letter'],
    non_delivery: [...BASE, 'non_delivery_certificate', 'carrier_claim_letter'],
    contamination: [...BASE, 'survey_report', 'photo_evidence'],
    delay: ['bill_of_lading', 'commercial_invoice', 'delivery_receipt'],
    general_average: ['bill_of_lading', 'commercial_invoice', 'general_average_bond', 'insurance_certificate'],
};

/** The documentary set a claim of this loss type must produce. Unknown/absent type → the base set. */
function requiredDocumentsFor(lossType) {
    return REQUIRED_BY_LOSS_TYPE[String(lossType || '').toLowerCase()] || [...BASE];
}

/**
 * Evaluate a claim's evidence against its own snapshotted requirement.
 * A role counts as satisfied only when a document is actually attached and the
 * adjuster has not rejected it.
 */
async function evaluate(claim) {
    const required = Array.isArray(claim.required_documents) && claim.required_documents.length
        ? claim.required_documents
        : requiredDocumentsFor(claim.loss_type);

    const rows = await db.InsuranceClaimDocument.findAll({ where: { claim_id: claim.id } });
    const usable = new Set(rows.filter((r) => r.status !== 'rejected' && r.document_id).map((r) => r.doc_role));
    const rejected = rows.filter((r) => r.status === 'rejected').map((r) => r.doc_role);

    const missing = required.filter((role) => !usable.has(role));
    return {
        required,
        attached: rows.map((r) => ({ role: r.doc_role, status: r.status, documentId: r.document_id, title: r.title })),
        satisfied: required.filter((role) => usable.has(role)),
        missing,
        rejected,
        complete: missing.length === 0,
    };
}

/** Re-evaluate and persist `evidence_complete`. Returns the evaluation. */
async function refresh(claim) {
    const state = await evaluate(claim);
    if (claim.evidence_complete !== state.complete) {
        await claim.update({ evidence_complete: state.complete });
    }
    return state;
}

module.exports = { requiredDocumentsFor, evaluate, refresh, REQUIRED_BY_LOSS_TYPE, BASE };
