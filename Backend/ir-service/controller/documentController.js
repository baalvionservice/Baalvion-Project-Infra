'use strict';
const documentService = require('../service/documentService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createDocumentSchema, updateDocumentSchema, paginationSchema } = require('../validators/schemas');

const listDocuments = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const isAuth = !!req.user;
        const orgId = req.user?.orgId || req.query.org_id;
        if (!orgId) return next(new AppError('BAD_REQUEST', 'org_id required', 400));
        const data = await documentService.listDocuments(orgId, isAuth, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createDocument = async (req, res, next) => {
    try {
        const parsed = createDocumentSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await documentService.createDocument(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getDocument = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || req.query.org_id;
        if (!orgId) return next(new AppError('BAD_REQUEST', 'org_id required', 400));
        const data = await documentService.getDocument(req.params.id, orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateDocument = async (req, res, next) => {
    try {
        const parsed = updateDocumentSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await documentService.updateDocument(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteDocument = async (req, res, next) => {
    try {
        await documentService.deleteDocument(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listDocuments, createDocument, getDocument, updateDocument, deleteDocument };
