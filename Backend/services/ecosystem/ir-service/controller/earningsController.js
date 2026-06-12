'use strict';
const earningsService = require('../service/earningsService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createEarningsSchema, updateEarningsSchema, paginationSchema } = require('../validators/schemas');

// Single-tenant IR service: derive orgId exclusively from the verified token;
// unauthenticated public reads fall back to the configured default — never trust
// a client-supplied org_id.
const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

const listEarnings = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await earningsService.listEarnings(orgId, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createEarnings = async (req, res, next) => {
    try {
        const parsed = createEarningsSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await earningsService.createEarnings(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getEarnings = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await earningsService.getEarnings(req.params.id, orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateEarnings = async (req, res, next) => {
    try {
        const parsed = updateEarningsSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await earningsService.updateEarnings(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const getTranscript = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await earningsService.getTranscript(req.params.id, orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listEarnings, createEarnings, getEarnings, updateEarnings, getTranscript };
