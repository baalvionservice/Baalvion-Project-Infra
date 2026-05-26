'use strict';
const dataSourceService = require('../service/dataSourceService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createDataSourceSchema, updateDataSourceSchema, paginationSchema } = require('../validators/schemas');

const listDataSources = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dataSourceService.listDataSources(req.user.orgId, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createDataSource = async (req, res, next) => {
    try {
        const parsed = createDataSourceSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dataSourceService.createDataSource(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getDataSource = async (req, res, next) => {
    try {
        const data = await dataSourceService.getDataSource(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateDataSource = async (req, res, next) => {
    try {
        const parsed = updateDataSourceSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dataSourceService.updateDataSource(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteDataSource = async (req, res, next) => {
    try {
        await dataSourceService.deleteDataSource(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const testConnection = async (req, res, next) => {
    try {
        const data = await dataSourceService.testConnection(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listDataSources, createDataSource, getDataSource, updateDataSource, deleteDataSource, testConnection };
