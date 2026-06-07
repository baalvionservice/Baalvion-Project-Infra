'use strict';
const applicationService = require('../service/applicationService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const {
    createApplicationSchema,
    reviewApplicationSchema,
    applicationQuerySchema,
} = require('../validators/schemas');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

// Public submission — a prospective investor requests access. No auth; the application
// is stamped to the default (Baalvion) org and starts in 'pending'.
const createApplication = async (req, res, next) => {
    try {
        const parsed = createApplicationSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const app = await applicationService.createApplication(DEFAULT_ORG_ID, parsed.data);
        // Return only what the public client needs (don't echo internal fields).
        return sendSuccess(req, res, { id: app.id, reference: app.reference, status: app.status }, 201);
    } catch (err) { return next(err); }
};

// Staff list (auth required) — scoped to the caller's org.
const listApplications = async (req, res, next) => {
    try {
        const parsed = applicationQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendPaginated(req, res, await applicationService.listApplications(orgId, parsed.data));
    } catch (err) { return next(err); }
};

const getApplication = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await applicationService.getApplication(req.params.id, orgId));
    } catch (err) { return next(err); }
};

// Approve / reject (auth required).
const reviewApplication = async (req, res, next) => {
    try {
        const parsed = reviewApplicationSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const reviewer = req.user?.id != null ? String(req.user.id) : 'system';
        return sendSuccess(req, res, await applicationService.reviewApplication(req.params.id, orgId, parsed.data, reviewer));
    } catch (err) { return next(err); }
};

module.exports = { createApplication, listApplications, getApplication, reviewApplication };
