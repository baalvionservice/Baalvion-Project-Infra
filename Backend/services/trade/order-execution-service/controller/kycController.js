'use strict';
/**
 * Authed REST surface for the tenant-bound KYC registry. The tenant is taken from req.auth
 * (tenantId || orgId) — NEVER from the body — so every verification is bound to the caller's
 * own tenant. The sanitized response NEVER leaks provider_verification_id (the server-side
 * Onfido id), so the order gate stays the only resolver of the (tenant, subject) -> status binding.
 */
const { z } = require('zod');
const kycRegistry = require('../services/kycRegistry');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

// Upper bound on a read subjectRef (matches the write-side schema max). Extracted so the guard is
// unit-testable without standing up the Express layer.
const MAX_SUBJECT_REF_LEN = 128;
const isSubjectRefTooLong = (subjectRef) => String(subjectRef || '').length > MAX_SUBJECT_REF_LEN;

const startSchema = z.object({
    subjectRef: z.string().max(128).optional(),
    orgId: z.string().max(128).optional(),
    subjectType: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
    fullName: z.string().max(256).optional(),
    legalName: z.string().max(256).optional(),
    country: z.string().length(2).optional(),
});

// Sanitized projection — never exposes provider_verification_id, idempotency_key or reasons.
const toView = (row) => ({
    subjectRef: row.subject_ref,
    subjectType: row.subject_type,
    status: row.status,
    provider: row.provider,
    updatedAt: row.updated_at,
});

const startVerification = async (req, res, next) => {
    try {
        const tenantId = tenantOf(req);
        if (!tenantId) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const body = startSchema.parse(req.body || {});
        const subjectRef = body.subjectRef || body.orgId;
        if (!subjectRef) return next(new AppError('BAD_REQUEST', 'subjectRef or orgId required', 400));

        const row = await kycRegistry.startVerification({
            tenantId,
            subjectRef,
            subjectType: body.subjectType,
            fullName: body.fullName,
            legalName: body.legalName,
            country: body.country,
        });
        return sendSuccess(req, res, toView(row), 201);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError('BAD_REQUEST', err.errors[0].message, 422));
        return next(err);
    }
};

const getStatus = async (req, res, next) => {
    try {
        const tenantId = tenantOf(req);
        if (!tenantId) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const subjectRef = String(req.params.subjectRef || '');
        if (!subjectRef) return next(new AppError('BAD_REQUEST', 'subjectRef required', 400));
        if (isSubjectRefTooLong(subjectRef)) return next(new AppError('BAD_REQUEST', `subjectRef must be <= ${MAX_SUBJECT_REF_LEN} chars`, 422));
        const refresh = req.query.refresh === 'true' || config.kyc.autoRefresh;

        const row = await kycRegistry.getBySubject({ tenantId, subjectRef }, { refresh });
        if (!row) return next(new AppError('NOT_FOUND', 'KYC verification not found', 404));
        return sendSuccess(req, res, toView(row));
    } catch (err) { return next(err); }
};

module.exports = { startVerification, getStatus, isSubjectRefTooLong, MAX_SUBJECT_REF_LEN };
