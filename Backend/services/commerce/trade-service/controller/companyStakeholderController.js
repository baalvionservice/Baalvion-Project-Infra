'use strict';
/**
 * Company Stakeholders — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 3). Directors/owners/shareholders/authorized signatories,
 * collection-scoped by org_id.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const companySvc = require('../service/verification/company');
const { CompanyStakeholder } = db;

async function fetchStakeholderOwned(id, req, next) {
    const record = await CompanyStakeholder.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Stakeholder not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Stakeholder not found', 404)); return null;
    }
    return record;
}

const createStakeholder = async (req, res, next) => {
    try {
        const { org_id, person_name, role, ownership_percentage = null, identity_verification_id = null } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!person_name) return next(new AppError('VALIDATION_ERROR', '`person_name` is required', 422));
        if (!role || !CompanyStakeholder.ROLES.includes(role)) {
            return next(new AppError('INVALID_ROLE', '`role` is required', 422, { allowed: CompanyStakeholder.ROLES }));
        }

        const record = await companySvc.addStakeholder({
            orgId, tenantId: org.tenant_id, personName: person_name, role,
            ownershipPercentage: ownership_percentage, identityVerificationId: identity_verification_id, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'company_stakeholder.added', resourceType: 'company_stakeholder',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, role },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const listStakeholders = async (req, res, next) => {
    try {
        const { org_id, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await CompanyStakeholder.findAndCountAll({
            where: { org_id: orgId }, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await CompanyStakeholder.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Stakeholder not found', 404));
    const { rejection_reason = null } = req.body || {};
    await companySvc.reviewStakeholder({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason });
    await recordAudit({
        actorId: actorOf(req), action: `company_stakeholder.${decision}`, resourceType: 'company_stakeholder',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveStakeholder = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectStakeholder = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

const deleteStakeholder = async (req, res, next) => {
    try {
        const record = await fetchStakeholderOwned(req.params.id, req, next);
        if (!record) return undefined;
        await companySvc.removeStakeholder(record);
        await recordAudit({
            actorId: actorOf(req), action: 'company_stakeholder.removed', resourceType: 'company_stakeholder',
            resourceId: record.id, tenantId: record.tenant_id, metadata: {},
        });
        return sendSuccess(req, res, { id: record.id, deleted: true });
    } catch (err) {
        return next(err);
    }
};

module.exports = { createStakeholder, listStakeholders, approveStakeholder, rejectStakeholder, deleteStakeholder };
