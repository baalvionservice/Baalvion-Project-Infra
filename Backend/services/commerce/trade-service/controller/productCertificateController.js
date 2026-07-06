'use strict';
/**
 * Product & Certificate Verification — HTTP surface (Phase 2 Trust/Verification/
 * Compliance Foundation, Step 8).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const certSvc = require('../service/verification/productCertificate');
const { ProductCertificate } = db;

async function fetchOwned(id, req, next) {
    const record = await ProductCertificate.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Product certificate not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Product certificate not found', 404)); return null;
    }
    return record;
}

const createProductCertificate = async (req, res, next) => {
    try {
        const {
            org_id, product_name, hs_code_id = null, certificate_type,
            country_of_origin = null, document_id = null, issued_at = null, expires_at = null,
        } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!product_name) return next(new AppError('VALIDATION_ERROR', '`product_name` is required', 422));
        if (!certificate_type || !ProductCertificate.CERTIFICATE_TYPES.includes(certificate_type)) {
            return next(new AppError('INVALID_CERTIFICATE_TYPE', '`certificate_type` is required', 422, { allowed: ProductCertificate.CERTIFICATE_TYPES }));
        }

        const record = await certSvc.submitCertificate({
            orgId, tenantId: org.tenant_id, productName: product_name, hsCodeId: hs_code_id,
            certificateType: certificate_type, countryOfOrigin: country_of_origin, documentId: document_id,
            issuedAt: issued_at, expiresAt: expires_at, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'product_certificate.submitted', resourceType: 'product_certificate',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, certificateType: certificate_type },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const listProductCertificates = async (req, res, next) => {
    try {
        const { org_id, certificate_type, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const where = { org_id: orgId };
        if (certificate_type) where.certificate_type = certificate_type;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await ProductCertificate.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await ProductCertificate.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Product certificate not found', 404));
    const { rejection_reason = null } = req.body || {};
    await certSvc.reviewCertificate({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason });
    await recordAudit({
        actorId: actorOf(req), action: `product_certificate.${decision}`, resourceType: 'product_certificate',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveProductCertificate = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectProductCertificate = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = { createProductCertificate, listProductCertificates, approveProductCertificate, rejectProductCertificate };
