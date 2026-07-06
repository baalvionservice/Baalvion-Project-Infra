'use strict';
/**
 * Address Verification — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 6).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const addressSvc = require('../service/verification/address');
const { VerifiedAddress } = db;

async function fetchOwned(id, req, next) {
    const record = await VerifiedAddress.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Address not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Address not found', 404)); return null;
    }
    return record;
}

const createAddress = async (req, res, next) => {
    try {
        const {
            org_id, address_type, line1, line2 = null, city = null, state = null,
            postal_code = null, country = null, latitude = null, longitude = null,
        } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!address_type || !VerifiedAddress.ADDRESS_TYPES.includes(address_type)) {
            return next(new AppError('INVALID_ADDRESS_TYPE', '`address_type` is required', 422, { allowed: VerifiedAddress.ADDRESS_TYPES }));
        }
        if (!line1) return next(new AppError('VALIDATION_ERROR', '`line1` is required', 422));

        const record = await addressSvc.submitAddress({
            orgId, tenantId: org.tenant_id, addressType: address_type, line1, line2, city, state,
            postalCode: postal_code, country, latitude, longitude, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'verified_address.submitted', resourceType: 'verified_address',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, addressType: address_type },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const listAddresses = async (req, res, next) => {
    try {
        const { org_id, address_type, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const where = { org_id: orgId };
        if (address_type) where.address_type = address_type;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await VerifiedAddress.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const addEvidence = async (req, res, next) => {
    try {
        const record = await fetchOwned(req.params.id, req, next);
        if (!record) return undefined;
        const { document_id, evidence_type } = req.body || {};
        const { AddressEvidence } = db;
        if (!document_id) return next(new AppError('VALIDATION_ERROR', '`document_id` is required', 422));
        if (!evidence_type || !AddressEvidence.EVIDENCE_TYPES.includes(evidence_type)) {
            return next(new AppError('INVALID_EVIDENCE_TYPE', '`evidence_type` is required', 422, { allowed: AddressEvidence.EVIDENCE_TYPES }));
        }
        const evidence = await addressSvc.attachEvidence({ addressId: record.id, documentId: document_id, evidenceType: evidence_type, tenantId: record.tenant_id, actor: actorOf(req) });
        await recordAudit({
            actorId: actorOf(req), action: 'verified_address.evidence_attached', resourceType: 'verified_address',
            resourceId: record.id, tenantId: record.tenant_id, metadata: { documentId: document_id, evidenceType: evidence_type },
        });
        return sendSuccess(req, res, evidence, 201);
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await VerifiedAddress.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Address not found', 404));
    const { rejection_reason = null } = req.body || {};
    await addressSvc.reviewAddress({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason });
    await recordAudit({
        actorId: actorOf(req), action: `verified_address.${decision}`, resourceType: 'verified_address',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveAddress = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectAddress = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = { createAddress, listAddresses, addEvidence, approveAddress, rejectAddress };
