'use strict';
const shareholderService = require('../service/shareholderService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createShareholderSchema, updateShareholderSchema, paginationSchema } = require('../validators/schemas');

const listShareholders = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await shareholderService.listShareholders(req.user.orgId, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createShareholder = async (req, res, next) => {
    try {
        const parsed = createShareholderSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await shareholderService.createShareholder(req.user.orgId, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const updateShareholder = async (req, res, next) => {
    try {
        const parsed = updateShareholderSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await shareholderService.updateShareholder(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteShareholder = async (req, res, next) => {
    try {
        await shareholderService.deleteShareholder(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listShareholders, createShareholder, updateShareholder, deleteShareholder };
