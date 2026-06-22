'use strict';
const service = require('../service/businessOnboardingService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const {
    createBusinessApplicationSchema,
    reviewBusinessApplicationSchema,
    businessApplicationQuerySchema,
    businessDocumentInputSchema,
    reviewBusinessDocumentSchema,
} = require('../validators/schemas');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

const validationError = (parsed) =>
    new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten());

// Public submission — a business completes onboarding (company + KYC + IEC/GST/VAT + docs).
// No auth; stamped to the default (Baalvion) org and starts in 'submitted'.
const createApplication = async (req, res, next) => {
    try {
        const parsed = createBusinessApplicationSchema.safeParse(req.body);
        if (!parsed.success) return next(validationError(parsed));
        const app = await service.createApplication(DEFAULT_ORG_ID, parsed.data);
        // Return only what the public client needs to confirm submission.
        return sendSuccess(req, res, {
            id: app.id,
            reference: app.reference,
            status: app.status,
            kyc_status: app.kyc_status,
            documents_count: Array.isArray(app.documents) ? app.documents.length : 0,
        }, 201);
    } catch (err) { return next(err); }
};

// Staff list (auth) — scoped to the caller's org.
const listApplications = async (req, res, next) => {
    try {
        const parsed = businessApplicationQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(validationError(parsed));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendPaginated(req, res, await service.listApplications(orgId, parsed.data));
    } catch (err) { return next(err); }
};

const getApplication = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await service.getApplication(req.params.id, orgId));
    } catch (err) { return next(err); }
};

// Approve / reject / move-to-review (auth).
const reviewApplication = async (req, res, next) => {
    try {
        const parsed = reviewBusinessApplicationSchema.safeParse(req.body);
        if (!parsed.success) return next(validationError(parsed));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const reviewer = req.user?.id != null ? String(req.user.id) : 'system';
        return sendSuccess(req, res, await service.reviewApplication(req.params.id, orgId, parsed.data, reviewer));
    } catch (err) { return next(err); }
};

const listDocuments = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await service.listDocuments(req.params.id, orgId));
    } catch (err) { return next(err); }
};

const addDocument = async (req, res, next) => {
    try {
        const parsed = businessDocumentInputSchema.safeParse(req.body);
        if (!parsed.success) return next(validationError(parsed));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const userId = req.user?.id ?? null;
        return sendSuccess(req, res, await service.addDocument(req.params.id, orgId, userId, parsed.data), 201);
    } catch (err) { return next(err); }
};

const reviewDocument = async (req, res, next) => {
    try {
        const parsed = reviewBusinessDocumentSchema.safeParse(req.body);
        if (!parsed.success) return next(validationError(parsed));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await service.reviewDocument(req.params.id, req.params.docId, orgId, parsed.data));
    } catch (err) { return next(err); }
};

module.exports = {
    createApplication,
    listApplications,
    getApplication,
    reviewApplication,
    listDocuments,
    addDocument,
    reviewDocument,
};
