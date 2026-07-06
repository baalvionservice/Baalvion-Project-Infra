'use strict';
/**
 * Tax Verification — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 4).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const taxSvc = require('../service/verification/tax');
const { TaxRegistration, TaxIdType } = db;

async function fetchOwned(id, req, next) {
    const record = await TaxRegistration.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Tax registration not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Tax registration not found', 404)); return null;
    }
    return record;
}

const createTaxRegistration = async (req, res, next) => {
    try {
        const { org_id, tax_id_type_id, tax_id_value, document_id = null } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!tax_id_value) return next(new AppError('VALIDATION_ERROR', '`tax_id_value` is required', 422));
        const taxIdType = await TaxIdType.findByPk(tax_id_type_id);
        if (!taxIdType || !taxIdType.is_active) return next(new AppError('INVALID_TAX_ID_TYPE', 'Unknown or inactive `tax_id_type_id`', 422));

        const formatError = taxSvc.validateFormat(taxIdType, tax_id_value);
        if (formatError) return next(new AppError('INVALID_TAX_ID_FORMAT', formatError, 422));

        const record = await taxSvc.submitTaxRegistration({
            orgId, tenantId: org.tenant_id, taxIdTypeId: taxIdType.id, taxIdValue: tax_id_value,
            documentId: document_id, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'tax_registration.submitted', resourceType: 'tax_registration',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, taxIdTypeCode: taxIdType.type_code },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const listTaxRegistrations = async (req, res, next) => {
    try {
        const { org_id, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await TaxRegistration.findAndCountAll({
            where: { org_id: orgId }, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await TaxRegistration.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Tax registration not found', 404));
    const { rejection_reason = null, expires_at = null } = req.body || {};
    await taxSvc.reviewTaxRegistration({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason, expiresAt: expires_at });
    await recordAudit({
        actorId: actorOf(req), action: `tax_registration.${decision}`, resourceType: 'tax_registration',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveTaxRegistration = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectTaxRegistration = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = { createTaxRegistration, listTaxRegistrations, approveTaxRegistration, rejectTaxRegistration };
