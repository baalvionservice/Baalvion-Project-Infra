'use strict';
const filingService = require('../service/filingService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createFilingSchema, updateFilingSchema, paginationSchema } = require('../validators/schemas');

// Single-tenant IR service: derive orgId exclusively from the verified token;
// unauthenticated public reads fall back to the configured default — never trust
// a client-supplied org_id.
const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

const listFilings = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await filingService.listFilings(orgId, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createFiling = async (req, res, next) => {
    try {
        const parsed = createFilingSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await filingService.createFiling(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getFiling = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await filingService.getFiling(req.params.id, orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateFiling = async (req, res, next) => {
    try {
        const parsed = updateFilingSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await filingService.updateFiling(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteFiling = async (req, res, next) => {
    try {
        await filingService.deleteFiling(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listFilings, createFiling, getFiling, updateFiling, deleteFiling };
