'use strict';
/**
 * Identity Verification — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 2). Thin controller: ownership + delegation to
 * service/verification/identity.js.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, callerTenantId, actorOf } = require('../service/verification/access');
const identitySvc = require('../service/verification/identity');
const { IdentityVerification } = db;

// trade.users.id is an INTEGER PK; a gateway identity's userId isn't guaranteed to
// be one (it can carry an arbitrary external string ID), so this only resolves
// when it actually parses as an integer — callers get a clean 422 otherwise
// instead of a raw Postgres type-mismatch 500.
function callerUserId(req) {
    const raw = req.auth && req.auth.userId;
    return /^\d+$/.test(String(raw)) ? Number(raw) : null;
}

async function fetchOwned(id, req, next) {
    const record = await IdentityVerification.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Identity verification not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const userId = callerUserId(req);
    if (String(record.user_id) !== String(userId)) {
        next(new AppError('NOT_FOUND', 'Identity verification not found', 404)); return null; // no existence leak
    }
    return record;
}

const submitIdentityVerification = async (req, res, next) => {
    try {
        const userId = callerUserId(req);
        if (!userId) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        const {
            org_id = null, full_name, date_of_birth = null, nationality = null,
            id_type, id_number_last4 = null, id_document_id = null, selfie_document_id = null,
        } = req.body || {};

        if (!full_name) return next(new AppError('VALIDATION_ERROR', '`full_name` is required', 422));
        if (!id_type || !IdentityVerification.ID_TYPES.includes(id_type)) {
            return next(new AppError('INVALID_ID_TYPE', '`id_type` is required', 422, { allowed: IdentityVerification.ID_TYPES }));
        }
        if (org_id) {
            const org = await db.Organization.findByPk(org_id);
            if (!org) return next(new AppError('ORG_NOT_FOUND', 'Organization not found', 404));
        }

        const record = await identitySvc.submit({
            userId, orgId: org_id, tenantId: callerTenantId(req) || 'T-DEMO', fullName: full_name,
            dateOfBirth: date_of_birth, nationality, idType: id_type, idNumberLast4: id_number_last4,
            idDocumentId: id_document_id, selfieDocumentId: selfie_document_id, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'identity_verification.submitted', resourceType: 'identity_verification',
            resourceId: record.id, tenantId: record.tenant_id, metadata: { userId, orgId: org_id, idType: id_type },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const getMyIdentityVerification = async (req, res, next) => {
    try {
        const userId = callerUserId(req);
        if (!userId) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        const record = await IdentityVerification.findOne({ where: { user_id: userId } });
        if (!record) return next(new AppError('NOT_FOUND', 'No identity verification on file', 404));
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

const getIdentityVerification = async (req, res, next) => {
    try {
        const record = await fetchOwned(req.params.id, req, next);
        if (!record) return undefined;
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

const listIdentityVerifications = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
        const { status, org_id, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (org_id) where.org_id = Number(org_id);
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await IdentityVerification.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const setLivenessResult = async (req, res, next) => {
    try {
        const record = await fetchOwned(req.params.id, req, next);
        if (!record) return undefined;
        const { status, provider = null, reference = null } = req.body || {};
        if (!status || !IdentityVerification.LIVENESS_STATUSES.includes(status)) {
            return next(new AppError('INVALID_LIVENESS_STATUS', '`status` is required', 422, { allowed: IdentityVerification.LIVENESS_STATUSES }));
        }
        await identitySvc.setLiveness({ identityVerification: record, status, provider, reference });
        await recordAudit({
            actorId: actorOf(req), action: 'identity_verification.liveness_result', resourceType: 'identity_verification',
            resourceId: record.id, tenantId: record.tenant_id, metadata: { status, provider },
        });
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await IdentityVerification.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Identity verification not found', 404));
    const { rejection_reason = null, expires_at = null } = req.body || {};
    await identitySvc.review({ identityVerification: record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason, expiresAt: expires_at });
    await recordAudit({
        actorId: actorOf(req), action: `identity_verification.${decision}`, resourceType: 'identity_verification',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveIdentityVerification = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectIdentityVerification = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = {
    submitIdentityVerification,
    getMyIdentityVerification,
    getIdentityVerification,
    listIdentityVerifications,
    setLivenessResult,
    approveIdentityVerification,
    rejectIdentityVerification,
};
